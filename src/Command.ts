module WSRelayClient {

    export class Command {

        public static encode(...parts: Object[]): string {
            let result = '';
            let first = true;
            for (let i in parts) {
                let part = parts[i].toString();
                let needsEnclosing = part === '' || part.indexOf(' ') !== -1 || part.indexOf('"') !== -1;
                let fixedPart = part.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
                if (needsEnclosing) {
                    fixedPart = '"' + fixedPart + '"';
                }
                if (first) {
                    first = false;
                } else {
                    result += ' ';
                }
                result += fixedPart;
            }
            return result;
        }

        public static decode(line: string): string[] {

            // A blank line contains no data at all
            if (line === '') {
                return [];
            }

            // Initialise some variables for the DFA-based state machine
            let result = [];
            let lexerState = 0;
            let currentPart = null;

            // Process every character in the line
            for (let i = 0; i < line.length; i++) {
                let c = line[i];

                switch (lexerState) {
                    case 0:
                        // Lexer state 0 is the normal state
                        if (c === ' ') {
                            result.push(currentPart);
                            currentPart = null;
                        } else if (c === '"') {
                            if (currentPart === null) {
                                currentPart = '';
                            }
                            lexerState = 1;
                        } else {
                            if (currentPart === null) {
                                currentPart = '';
                            }
                            currentPart += c;
                        }
                        break;

                    case 1:
                        // Lexer state 1 is the quote-enclosed string state
                        if (c === '"') {
                            lexerState = 0;
                        } else if (c === '\\') {
                            lexerState = 2;
                        } else {
                            currentPart += c;
                        }
                        break;

                    case 2:
                        // Lexer state 2 is the escape sequence within a quote-enclosed string state
                        currentPart += c;
                        lexerState = 1;
                        break;
                }
            }

            // Return the parts (making sure to add the last part)
            result.push(currentPart);
            return result;
        }

    }

}