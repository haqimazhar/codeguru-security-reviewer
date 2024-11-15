import { Octokit } from '@octokit/rest';
import { CommentMap, ReviewComment, GithubClient } from '../types';
export declare class GitHubReviewClient implements GithubClient {
    octokit: Octokit;
    repoOwner: string;
    repoName: string;
    prNumber: string;
    commitSha: string;
    constructor(token: string, repository: string, prNumber: string, commitSha: string);
    fetchExistingComments(): Promise<CommentMap>;
    createReviewComment(comment: ReviewComment): Promise<void>;
}
