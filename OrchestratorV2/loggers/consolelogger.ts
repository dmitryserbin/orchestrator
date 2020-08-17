import { IConsoleLogger } from "../interfaces/loggers/consolelogger";

export class ConsoleLogger implements IConsoleLogger {

    constructor() { /* */ }

    public log(message: any): void {

        console.log(message);

    }

    public warn(message: any): void {

        console.warn(message);

    }

}