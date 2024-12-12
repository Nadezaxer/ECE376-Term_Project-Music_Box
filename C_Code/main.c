#include "LCD_PortD.c";
#include "MusicData.c";
#include <pic18.h>;


enum InstructionCodes {
    SET_TEMPO = 0x40,            // 0100:1111 2222:2222 2222:2222
    END = 0x60,                  // 0110:xxxx xxxx:xxxx xxxx:xxxx
    SET_VOICE0_FREQUENCY = 0x80, // 1000:xxxx BBBB:BBBB xAAA:AxCC
    SET_VOICE1_FREQUENCY = 0x90, // 1001:22xx 1111:1111 1111:1111
    SET_VOICE2_FREQUENCY = 0xA0, // 1010:22xx 1111:1111 1111:1111
    SET_VOICE0_VOLUME = 0xC0,    // 1100:x111 1111:1111 xxxx:xxxx
    SET_VOICE1_VOLUME = 0xD0,    // 1101:x111 1111:1111 xxxx:xxxx
    SET_VOICE2_VOLUME = 0xE0,    // 1110:x111 1111:1111 xxxx:xxxx
};

// Global Variables

// Variables for Voices
short Voice0Vol;
short Voice1Vol;
short Voice2Vol;

unsigned short Voice1Count;
unsigned short Voice2Count;

__bit Voice0High;
__bit Voice1High;
__bit Voice2High;

// Variables of Instruction Handing
unsigned short TickCount;
__uint24 tick;
unsigned short InstructionIndex;
__uint24 InstructionTick;

__uint24 *Song;
unsigned char currentSong;

__uint24 FullInstruction __at(0x02);

// Variables for Digital to Analog converter
unsigned short DAOut __at(0x00);

// Sends whatever is in DAOut to the Digital to Analog converter
void DASend(void) {
    __asm("MOVLW 0x0F");
    __asm("ANDWF ((c:0x01)), F");
    __asm("MOVLW 0x30");
    __asm("IORWF ((c:0x01)), F");

    RC2 = 0;

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 7");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 6");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 5");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 4");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 3");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 2");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 1");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x01)), 0");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 7");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 6");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 5");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 4");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 3");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 2");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 1");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    __asm("BCF ((c:0xF82)), 0");
    __asm("BTFSC ((c:0x00)), 0");
    __asm("BSF ((c:0xF82)), 0");
    __asm("BSF ((c:0xF82)), 1");
    __asm("BCF ((c:0xF82)), 1");

    PORTC = 0x4;
}

// This interrupt servicer handles all the Track/Song instructions
void __interrupt(low_priority) TickInterruptServicer(void) {
    if (TMR0IF) {
        TMR0 = TickCount;
        TMR0IF = 0;

        // While Loop for when there are multiple instructions on the same loop
        while (InstructionTick == tick) {

            // Geting the next instruction and seting subpart variables
            FullInstruction = *(__int24 *)(Song + (InstructionIndex << 1) + 1);
            char InstructionHead = *(char *)(0x002 /*FullInstruction*/ + 2);
            int InstructionBody = *(int *)(0x002 /*FullInstruction*/);

            switch (InstructionHead & 0xF0) {
            case SET_TEMPO: {
                T0CON = 0x80 | (InstructionHead & 0x0F);
                TickCount = 34 - InstructionBody; // Offset based off of recorded value at set time
                InstructionIndex++;
                break;
            }
            case END: {
                // Clears everything for next song
                PEIE = 0;
                GIE = 0;

                Voice0Vol = 0;
                Voice1Vol = 0;
                Voice2Vol = 0;

                InstructionTick = 0;
                InstructionIndex = 0;
                tick = 0;
                currentSong = 0;

                LCD_Move(0, 0);
                for (char i = 0; i < 16; i++) {
                    LCD_Write(SongTitles[0][i]);
                }
                LCD_Move(1, 0);
                for (char i = 16; i < 32; i++) {
                    LCD_Write(SongTitles[0][i]);
                }

                return;
            }
            case SET_VOICE0_FREQUENCY: {
                PR2 = *(char *)(0x002 /*FullInstruction*/ + 1);
                T2CON = *(char *)(0x002 /*FullInstruction*/) | 4;
                InstructionIndex++;
                break;
            }
            case SET_VOICE1_FREQUENCY: {
                T3CON = 0x81 | (InstructionHead & 0x0C) << 2;
                Voice1Count = 31 - InstructionBody; // Offset based off of recorded value at set time
                InstructionIndex++;
                break;
            }
            case SET_VOICE2_FREQUENCY: {
                T1CON = 0x81 | (InstructionHead & 0x0C) << 2;
                Voice2Count = 21 - InstructionBody; // Offset based off of recorded value at set time
                InstructionIndex++;
                break;
            }
            case SET_VOICE0_VOLUME: {
                int Volume = FullInstruction & 0x7FF;
                Voice0Vol = Volume / 4;
                InstructionIndex++;
                break;
            }
            case SET_VOICE1_VOLUME: {
                int Volume = FullInstruction & 0x7FF;
                Voice1Vol = Volume / 4;
                InstructionIndex++;
                break;
            }
            case SET_VOICE2_VOLUME: {
                int Volume = FullInstruction & 0x7FF;
                Voice2Vol = Volume / 2;
                InstructionIndex++;
                break;
            }

            default:
                break;
            }
            InstructionTick = *(Song + (InstructionIndex << 1));
        }
        tick++;
    }
}

// This interrupt servicer handles all the note generation
void __interrupt() InterruptServicer(void) {
    
    if (TMR1IF) {
        TMR1 = Voice2Count;
        TMR1IF = 0;
        Voice2High = !Voice2High;
    }
    if (TMR2IF) {
        TMR2IF = 0;
        Voice0High = !Voice0High;
    }
    if (TMR3IF) {
        TMR3 = Voice1Count;
        TMR3IF = 0;
        Voice1High = !Voice1High;
    }

    DAOut = 0x800;
    if (Voice0High) {
        DAOut += Voice0Vol;
    } else {
        DAOut -= Voice0Vol;
    }
    if (Voice1High) {
        DAOut += Voice1Vol;
    } else {
        DAOut -= Voice1Vol;
    }
    if (Voice2High) {
        DAOut += Voice2Vol;
    } else {
        DAOut -= Voice2Vol;
    }
    DASend();
}

void main(void) {
    /*******************************************|
    |                Input/Output               |
    |            PortB/In - PortC/Out           |
    |*******************************************/
    TRISB = 0XFF;
    TRISC = 0;

    PORTB = 0;
    PORTC = 0;

    /*******************************************|
    |         Enable Interrupt priority         |
    |*******************************************/
    IPEN = 1;

    /********************************************|
    |                Setup Timer0                |
    | Refer to Data sheet Section 11 for details |
    |********************************************/
    T0CS = 0;
    T0CON = 0x81; // PS = 4
    TMR0IE = 1;   // Timer0 Overflow Interrupt Enable
    TMR0IP = 0;   // Timer0 Overflow Interrupt Priority
    TMR0ON = 1;   // Timer0 On

    /********************************************|
    |                Setup Timer1                |
    | Refer to Data sheet Section 12 for details |
    |********************************************/
    TMR1CS = 0;
    T1CON = 0x81; // PS = 1
    TMR1IE = 1;   // Timer1 Overflow Interrupt Enable
    TMR1IP = 1;   // Timer1 Overflow Interrupt Priority
    TMR1ON = 1;   // Timer1 On

    /********************************************|
    |                Setup Timer2                |
    | Refer to Data sheet Section 13 for details |
    |********************************************/
    T2CON = 0;
    PR2 = 0xFF;
    TMR2IE = 1; // Timer2 Interrupt Enable
    TMR2IP = 1; // Timer2 Interrupt Priority
    TMR2ON = 1; // Timer2 On

    /********************************************|
    |                Setup Timer3                |
    | Refer to Data sheet Section 14 for details |
    |********************************************/
    TMR3CS = 0;
    T3CON = 0x81; // PS = 1
    TMR3IE = 1;   // Timer3 Overflow Interrupt Enable
    TMR3IP = 1;   // Timer3 Overflow Interrupt Priority
    TMR3ON = 1;   // Timer3 On

    /********************************************|
    |                Other Setup                 |
    |********************************************/

    // Setup LCD to display which song is playing
    LCD_Init();

    // Setup Serial for Debug
    //   SCI_Init();

    /*********************************************|
    |               Main While Loop               |
    |                                             |
    | Controls which song is playing and switches |
    | the song when a button is pressed           |
    |*********************************************/

    while (1) {
        char PORTBSample = PORTB;

        if (PORTBSample && PORTBSample != currentSong) {
            PEIE = 0;
            GIE = 0;
            char a = 0;

            switch (PORTBSample) {
            case 1:
                currentSong = 1;
                a = 0;
                break;
            case 2:
                currentSong = 2;
                a = 1;
                break;
            case 4:
                currentSong = 4;
                a = 2;
                break;
            case 8:
                currentSong = 8;
                a = 3;
                break;
            case 16:
                currentSong = 16;
                a = 4;
                break;
            case 32:
                currentSong = 32;
                a = 5;
                break;
            case 64:
                currentSong = 64;
                a = 6;
                break;
            case 128:
                currentSong = 128;
                a = 7;
                break;
            }

            Voice0Vol = 0x00;
            Voice1Vol = 0x00;
            Voice2Vol = 0x00;

            InstructionTick = 0;
            InstructionIndex = 0;
            tick = 0;

            Song = SongPointers[a];

            LCD_Move(0, 0);
            for (char i = 0; i < 16; i++) {
                LCD_Write(SongTitles[a][i]);
            }
            LCD_Move(1, 0);
            for (char i = 16; i < 32; i++) {
                LCD_Write(SongTitles[a][i]);
            }

            if (Song != &Blank) {
                PEIE = 1;
                GIE = 1;
            }
        }
    }
}