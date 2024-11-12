import { ReviewComment } from '../types';
export declare class SarifParser {
    private sarifPath;
    constructor(sarifFilePath: string);
    parse(): ReviewComment[];
}
