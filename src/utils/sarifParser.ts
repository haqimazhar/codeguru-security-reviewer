// sarifParser.ts
import fs from 'fs'
import path from 'path'
import { SarifData, ReviewComment } from '../types/index.js'

export class SarifParser {
	private sarifPath: string

	constructor(sarifFilePath: string) {
		this.sarifPath = path.join(process.cwd(), sarifFilePath)
	}

	parse(): ReviewComment[] {
		try {
			const sarifContent = fs.readFileSync(this.sarifPath, 'utf8')
			const sarifData: SarifData = JSON.parse(sarifContent)

			console.log('SARIF data loaded successfully')

			return sarifData.runs[0].results.map(result => {
				const filePath =
					result.locations[0].physicalLocation.artifactLocation.uri
				const lineNumber = result.locations[0].physicalLocation.region.startLine
				const message = result.message.text

				console.log(
					`Processing comment for the file: ${filePath}, line: ${lineNumber}`
				)

				return {
					body: message,
					path: filePath,
					line: lineNumber
				}
			})
		} catch (error) {
			console.error('Error parsing SARIF file:', error)
			throw error
		}
	}
}
