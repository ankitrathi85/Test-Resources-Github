const { Octokit } = require('@octokit/rest');
const moment = require('moment');

class GitHubAPI {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'test-automation-resources-scanner v1.0.0'
    });
    this.rateLimitDelay = parseInt(process.env.RATE_LIMIT_DELAY) || 1000;
  }

  async searchRepositories(query, options = {}) {
    const { page = 1, perPage = 100, sort = 'stars', order = 'desc' } = options;
    
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await this.octokit.rest.search.repos({
        q: query,
        sort,
        order,
        page,
        per_page: perPage
      });

      return response.data;
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.searchRepositories(query, options);
      }
      throw error;
    }
  }

  async getRepository(owner, repo) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      return response.data;
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.getRepository(owner, repo);
      }
      throw error;
    }
  }

  async getRepositoryContents(owner, repo, path = '') {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });

      return response.data;
    } catch (error) {
      if (error.status === 404) {
        return null; // File doesn't exist
      }
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.getRepositoryContents(owner, repo, path);
      }
      throw error;
    }
  }

  async getRepositoryReleases(owner, repo) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: 10
      });

      return response.data;
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.getRepositoryReleases(owner, repo);
      }
      return []; // No releases or error
    }
  }

  async getRepositoryCommits(owner, repo, since = null) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const params = {
        owner,
        repo,
        per_page: 100
      };

      if (since) {
        params.since = since;
      }

      const response = await this.octokit.rest.repos.listCommits(params);
      return response.data;
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.getRepositoryCommits(owner, repo, since);
      }
      return []; // No commits or error
    }
  }

  async getRepositoryContributors(owner, repo) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100
      });

      return response.data;
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await this.delay(60000);
        return this.getRepositoryContributors(owner, repo);
      }
      return []; // No contributors or error
    }
  }

  async getRateLimit() {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      return response.data;
    } catch (error) {
      console.error('Error getting rate limit:', error);
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  buildSearchQuery(terms, filters = {}) {
    let query = terms.join(' OR ');
    
    // Add filters
    if (filters.language) {
      query += ` language:${filters.language}`;
    }
    
    if (filters.minStars) {
      query += ` stars:>=${filters.minStars}`;
    }
    
    if (filters.pushed) {
      query += ` pushed:>${filters.pushed}`;
    }
    
    if (filters.archived === false) {
      query += ' archived:false';
    }
    
    if (filters.fork === false) {
      query += ' fork:false';
    }

    return query;
  }

  isRepositoryActive(repo, maxAgeMonths = 18) {
    const lastUpdate = moment(repo.pushed_at);
    const monthsOld = moment().diff(lastUpdate, 'months');
    return monthsOld <= maxAgeMonths;
  }
}

module.exports = GitHubAPI;
