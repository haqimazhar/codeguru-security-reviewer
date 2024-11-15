// sarifParser.test.ts
import fs from 'fs'
import path from 'path'
import { SarifParser } from '../../src/utils/sarifParser'
import { SarifData, ReviewComment } from '../../src/types'

// Mock fs.readFileSync
jest.mock('fs')

describe('SarifParser', () => {
	const sarifFilePath = 'path/to/sarif/file.sarif'
	const sarifData: SarifData = {
		runs: [
			{
				results: [
					{
						message: { text: 'Test message 1' },
						locations: [
							{
								physicalLocation: {
									artifactLocation: { uri: 'file1.ts' },
									region: { startLine: 10 }
								}
							}
						]
					},
					{
						message: { text: 'Test message 2' },
						locations: [
							{
								physicalLocation: {
									artifactLocation: { uri: 'file2.ts' },
									region: { startLine: 20 }
								}
							}
						]
					}
				]
			}
		]
	}

	const expectedComments: ReviewComment[] = [
		{ body: 'Test message 1', path: 'file1.ts', line: 10 },
		{ body: 'Test message 2', path: 'file2.ts', line: 20 }
	]

	beforeEach(() => {
		jest.clearAllMocks()
		;(fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sarifData))
	})

	describe('parse', () => {
		it('should parse SARIF data and return an array of ReviewComment objects', () => {
			const parser = new SarifParser(sarifFilePath)
			const comments = parser.parse()

			expect(comments).toEqual(expectedComments)
			expect(fs.readFileSync).toHaveBeenCalledWith(
				path.join(process.cwd(), sarifFilePath),
				'utf8'
			)
		})

		it('should throw an error if SARIF file parsing fails', () => {
			const error = new Error('Failed to read file')
			;(fs.readFileSync as jest.Mock).mockImplementation(() => {
				throw error
			})

			const parser = new SarifParser(sarifFilePath)

			expect(() => parser.parse()).toThrow(error)
			expect(fs.readFileSync).toHaveBeenCalledWith(
				path.join(process.cwd(), sarifFilePath),
				'utf8'
			)
		})
	})
})
