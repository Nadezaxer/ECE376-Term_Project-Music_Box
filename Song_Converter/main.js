"use strict";
// Math.round( (10^7) / ( 2*Frequency ) )
Object.defineProperty(exports, "__esModule", { value: true });
// Voice Types: Square, Triangle                                    Both have to be implemented
// Volume Types: Bell (Exponential Decay), Wind (Constant Value)    Only Wind Has to be Implemented
const midi = require("midi-file");
const fs = require("fs");
let midiNoteToFrequency = (midiNote) => 2 ** ((midiNote - 69) / 12) * 440;
function FindTimer0Values(Frequency) {
    const ClockTime = 100E-9; // S/C
    const targetClocks = 1 / (ClockTime * Frequency);
    let preScale = 0;
    while (targetClocks > Math.pow(2, 16 + preScale) && preScale < 9) {
        preScale++;
    }
    if (Math.round(targetClocks / Math.pow(2, preScale)) > 0xFFFF) {
        throw "Frequency out of Bounds";
    }
    return [Math.round(targetClocks / Math.pow(2, preScale)), preScale == 0 ? 0x8 : preScale - 1];
}
function FindTimer1Values(Frequency) {
    const ClockTime = 100E-9; // S/C
    const targetClocks = 1 / (ClockTime * Frequency * 2);
    let preScale = 0;
    while (targetClocks > Math.pow(2, 16 + preScale) && preScale < 4) {
        preScale++;
    }
    if (Math.round(targetClocks / Math.pow(2, preScale)) > 0xFFFF) {
        throw "Frequency out of Bounds";
    }
    return [Math.round(targetClocks / Math.pow(2, preScale)), preScale];
}
function FindTimer2Values(Frequency) {
    const ClockTime = 100E-9; // S/C
    const targetClocks = 1 / (ClockTime * Frequency * 2);
    const CValues = [1, 4, 16];
    let closestSolution = [targetClocks, 0, 0, 0];
    for (let A = 1; A <= 16; A++) {
        for (let B = 1; B <= 256; B++) {
            for (let Ci = 0; Ci < CValues.length; Ci++) {
                let C = CValues[Ci];
                let clocks = Math.abs(A * B * C - targetClocks);
                if (clocks < closestSolution[0]) {
                    closestSolution = [clocks, A - 1, B - 1, Ci];
                }
            }
        }
    }
    return closestSolution.slice(1);
}
function FindTimer3Values(Frequency) {
    const ClockTime = 100E-9; // S/C
    const targetClocks = 1 / (ClockTime * Frequency * 2);
    let preScale = 0;
    while (targetClocks > Math.pow(2, 16 + preScale) && preScale < 4) {
        preScale++;
    }
    if (Math.round(targetClocks / Math.pow(2, preScale)) > 0xFFFF) {
        throw "Frequency out of Bounds";
    }
    return [Math.round(targetClocks / Math.pow(2, preScale)), preScale];
}
const tickScaleFactor = 1 / 1;
function MidiToPicInstructions(data) {
    const ticksPerBeat = (data.header.ticksPerBeat ?? 0) * tickScaleFactor;
    if (ticksPerBeat == 0) {
        throw "Song ticksPerBeat is not defined";
    }
    let Instructions = [];
    for (let t = 0; t < data.tracks.length && t < 3; t++) {
        const track = data.tracks[t];
        let currentNote = 0;
        let timeTick = 0;
        for (let i = 0; i < track.length; i++) {
            const event = track[i];
            timeTick += event.deltaTime * tickScaleFactor;
            switch (event.type) {
                case "noteOff":
                    // Note off
                    if (event.noteNumber != currentNote) {
                        throw `Instruction ${i} requested that a note be turned off that is not the note currently being played`;
                    }
                    currentNote = 0;
                    Instructions.push({ tick: timeTick, instruction: "Note off", voice: t });
                    break;
                case "noteOn":
                    // Note on
                    if (0 != currentNote) {
                        throw `Instruction ${i} requested that a note be played while a note is already being played`;
                    }
                    currentNote = event.noteNumber;
                    Instructions.push({ tick: timeTick, instruction: "Note on", note: event.noteNumber, velocity: event.velocity, voice: t });
                    break;
                case "noteAftertouch":
                    // Change Note volume
                    if (event.noteNumber != currentNote) {
                        throw `Instruction ${i} requested that a note change volume that is not the note currently being played`;
                    }
                    console.log("Note change was used");
                    Instructions.push({ tick: timeTick, instruction: "Note change", velocity: event.amount, voice: t });
                    break;
                case "controller":
                    switch (event.controllerType) {
                        case 7:
                            // Volume
                            Instructions.push({ tick: timeTick, instruction: "Volume", Volume: event.value, voice: t });
                            break;
                        default:
                            console.warn(`Controller instruction was requested, but the controllerType "${event.controllerType}" is unimplemented`);
                            break;
                    }
                    break;
                case "setTempo":
                    Instructions.push({ tick: timeTick, instruction: "Tempo", tickLengthUs: event.microsecondsPerBeat / ticksPerBeat });
                    break;
                case "timeSignature":
                case "keySignature":
                case "text":
                case "copyrightNotice":
                case "trackName":
                case "instrumentName":
                case "lyrics":
                case "marker":
                    // Doesn't Matter
                    break;
                default:
                    console.warn(`The instruction type "${event.type}" at instruction ${i} was requested but is unimplemented`);
                    break;
            }
        }
    }
    Instructions.sort((a, b) => a.tick - b.tick);
    let RawInstructions = [];
    let VoiceVol = [0.5, 0.5, 0.5];
    let VoiceVel = [0, 0, 0];
    for (let i = 0; i < Instructions.length; i++) {
        const ParsedInstruction = Instructions[i];
        RawInstructions.push(Math.round(ParsedInstruction.tick));
        switch (ParsedInstruction.instruction) {
            case "Note off":
                RawInstructions.push((0xC + ParsedInstruction.voice) << 20);
                VoiceVel[ParsedInstruction.voice] = 0;
                break;
            case "Note on":
                switch (ParsedInstruction.voice) {
                    case 0:
                        let [A, B, C] = FindTimer2Values(midiNoteToFrequency(ParsedInstruction.note));
                        RawInstructions.push((0x8 + ParsedInstruction.voice) << 20 | B << 8 | (A & 0xF) << 3 | C);
                        break;
                    case 1:
                    case 2:
                        let [count, preScale] = FindTimer1Values(midiNoteToFrequency(ParsedInstruction.note));
                        RawInstructions.push((0x8 + ParsedInstruction.voice) << 20 | preScale << 18 | count);
                        break;
                }
                RawInstructions.push(Math.round(ParsedInstruction.tick));
            case "Note change":
                VoiceVel[ParsedInstruction.voice] = ParsedInstruction.velocity / 128;
                RawInstructions.push((0xC + ParsedInstruction.voice) << 20 | Math.round(VoiceVel[ParsedInstruction.voice] * VoiceVol[ParsedInstruction.voice] * 2 ** 11));
                break;
            case "Volume":
                VoiceVol[ParsedInstruction.voice] = ParsedInstruction.Volume / 128;
                RawInstructions.push((0xC + ParsedInstruction.voice) << 20 | Math.round(VoiceVel[ParsedInstruction.voice] * VoiceVol[ParsedInstruction.voice] * 2 ** 11));
                break;
            case "Tempo":
                let [count, preScale] = FindTimer0Values(1 / (ParsedInstruction.tickLengthUs * 1e-6));
                RawInstructions.push((0x4) << 20 | preScale << 16 | count);
                break;
        }
    }
    RawInstructions.push(Math.round(Instructions.at(-1)?.tick ?? 0), (0x6) << 20);
    let rawData = new Uint8Array(RawInstructions.length * 3);
    RawInstructions.forEach((value, i) => {
        rawData[i * 3 + 0] = value & 0xFF;
        rawData[i * 3 + 1] = value / 2 ** 8 & 0xFF;
        rawData[i * 3 + 2] = value / 2 ** 16 & 0xFF;
    });
    let count = 0;
    let hexDataList = rawData.reduce((prev, current) => {
        if (count == 6) {
            count = 1;
            return (prev + `\n0x${current.toString(16).padStart(2, "0")}, `);
        }
        count++;
        return (prev + `0x${current.toString(16).padStart(2, "0")}, `);
    }, "").slice(0, -2);
    return [hexDataList, Instructions];
}
const ScaleFile = fs.readFileSync(__dirname + "/Songs/Scale.mid");
const ScaleData = midi.parseMidi(ScaleFile);
const [ScaleHexData, ScaleInstructions] = MidiToPicInstructions(ScaleData);
const ChromaticArpeggioFile = fs.readFileSync(__dirname + "/Songs/ChromaticArpeggio.mid");
const ChromaticArpeggioData = midi.parseMidi(ChromaticArpeggioFile);
const [ChromaticArpeggioHexData, ChromaticArpeggioInstructions] = MidiToPicInstructions(ChromaticArpeggioData);
const LegendOfZelda_OverworldFile = fs.readFileSync(__dirname + "/Songs/LegendOfZelda_Overworld.mid");
const LegendOfZelda_OverworldData = midi.parseMidi(LegendOfZelda_OverworldFile);
const [LegendOfZelda_OverworldHexData, LegendOfZelda_OverworldInstructions] = MidiToPicInstructions(LegendOfZelda_OverworldData);
const MegalovaniaFile = fs.readFileSync(__dirname + "/Songs/Megalovania.mid");
const MegalovaniaData = midi.parseMidi(MegalovaniaFile);
const [MegalovaniaHexData, MegalovaniaInstructions] = MidiToPicInstructions(MegalovaniaData);
const LavenderTownFile = fs.readFileSync(__dirname + "/Songs/LavenderTown.mid");
const LavenderTownData = midi.parseMidi(LavenderTownFile);
const [LavenderTownHexData, LavenderTownInstructions] = MidiToPicInstructions(LavenderTownData);
const PalletTownFile = fs.readFileSync(__dirname + "/Songs/PalletTown.mid");
const PalletTownData = midi.parseMidi(PalletTownFile);
const [PalletTownHexData, PalletTownInstructions] = MidiToPicInstructions(PalletTownData);
const FrequencyTestFile = fs.readFileSync(__dirname + "/Songs/FrequencyTest.mid");
const FrequencyTestData = midi.parseMidi(FrequencyTestFile);
const [FrequencyTestHexData, FrequencyTestInstructions] = MidiToPicInstructions(FrequencyTestData);
const fileHead = `#ifndef REDUCED_SIZE
#define REDUCED_SIZE 0
#endif

const unsigned char Blank[] = {
0x00, 0x00, 0x00, 0x00, 0x00, 0x60
};
`;
const fileFoot = `
#endif


#if REDUCED_SIZE == 0

const char SongTitles[8][32] = {
//  "<**************><**************>"
    "                                ",
    "     Scale                      ",
    "   Chromatic        Arpeggio    ",
    "Legend Of Zelda    Overworld    ",
    "  Megalovania                   ",
    " Lavender Town                  ",
    "  Pallet Town                   ",
    " Frequency Test                 ",
};

const char *SongPointers[8] = {
    &Blank,
    &Scale,
    &ChromaticArpeggio,
    &LegendOfZelda_Overworld,
    &Megalovania,
    &LavenderTown,
    &PalletTown,
    &FrequencyTest
};

#else

const char SongTitles[8][32] = {
//  "<**************><**************>"
    "                                ",
    "     Scale                      ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
};

const char *SongPointers[8] = {
    &Blank,
    &Scale,
    &Blank,
    &Blank,
    &Blank,
    &Blank,
    &Blank,
    &Blank
};
#endif
`;
const MusicData = fileHead + `
const unsigned char Scale[] = {
${ScaleHexData}
};

#if REDUCED_SIZE == 0
` + `
const unsigned char ChromaticArpeggio[] = {
${ChromaticArpeggioHexData}
};
` + `
const unsigned char LegendOfZelda_Overworld[] = {
${LegendOfZelda_OverworldHexData}
};
` + `
const unsigned char Megalovania[] = {
${MegalovaniaHexData}
};
` + `
const unsigned char LavenderTown[] = {
${LavenderTownHexData}
};
` + `
const unsigned char PalletTown[] = {
${PalletTownHexData}
};
` + `
const unsigned char FrequencyTest[] = {
${FrequencyTestHexData}
};
` + fileFoot;
fs.writeFileSync(__dirname + "/MusicData.c", MusicData);
