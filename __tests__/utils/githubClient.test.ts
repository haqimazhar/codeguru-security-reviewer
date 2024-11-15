// githubClient.test.ts
import { GitHubReviewClient } from '../../src/utils/githubClient'
import { CommentMap, ReviewComment } from '../../src/types'

// Mock Octokit instance
jest.mock('@octokit/rest', () => ({
	Octokit: jest.fn().mockImplementation(() => ({
		pulls: {
			listReviewComments: jest.fn(),
			createReview: jest.fn()
		}
	}))
}))

describe('GitHubReviewClient', () => {
	let githubClient: GitHubReviewClient
	const token = 'fake-token'
	const repository = 'owner/repo'
	const prNumber = '1'
	const commitSha = 'fake-sha'

	beforeEach(() => {
		githubClient = new GitHubReviewClient(
			token,
			repository,
			prNumber,
			commitSha
		)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('fetchExistingComments', () => {
		it('should fetch existing comments and return a CommentMap', async () => {
			const mockComments = [
				{ path: 'file1.ts', line: 10 },
				{ path: 'file2.ts', line: 15 },
				{ path: 'file1.ts', line: 20 }
			]

			const listReviewComments = githubClient.octokit.pulls
				.listReviewComments as unknown as jest.Mock
			listReviewComments.mockResolvedValue({ data: mockComments })

			const expectedCommentMap: CommentMap = {
				'file1.ts': { 10: true, 20: true },
				'file2.ts': { 15: true }
			}

			const result = await githubClient.fetchExistingComments()
			expect(result).toEqual(expectedCommentMap)
			expect(
				githubClient.octokit.pulls.listReviewComments
			).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				pull_number: parseInt(prNumber)
			})
		})
	})

	describe('createReviewComment', () => {
		it('should create a review comment successfully', async () => {
			const mockComment: ReviewComment = {
				path: 'file1.ts',
				body: 'This is a test comment',
				line: 10
			}
			const createReview = githubClient.octokit.pulls
				.createReview as unknown as jest.Mock
			createReview.mockResolvedValue({})

			await githubClient.createReviewComment(mockComment)

			expect(githubClient.octokit.pulls.createReview).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				pull_number: parseInt(prNumber),
				commit_id: commitSha,
				body: '🔍 Codeguru Security Review 🔍',
				event: 'COMMENT',
				comments: [
					{
						path: mockComment.path,
						body: `🚨 ${mockComment.body}`,
						line: mockComment.line
					}
				],
				headers: {
					'X-GitHub-Api-Version': '2022-11-28'
				}
			})
		})

		it('should handle errors when creating a review comment', async () => {
			const mockComment: ReviewComment = {
				path: 'file1.ts',
				body: 'This is a test comment',
				line: 10
			}
			const error = new Error('Failed to create review')
			;(
				githubClient.octokit.pulls.createReview as unknown as jest.Mock
			).mockRejectedValue(error)

			await expect(
				githubClient.createReviewComment(mockComment)
			).rejects.toThrow(error)
		})
	})
})
