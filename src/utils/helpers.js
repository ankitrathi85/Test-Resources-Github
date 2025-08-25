const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class Helpers {
  static async ensureDirectory(dirPath) {
    await fs.ensureDir(dirPath);
  }

  static async writeJsonFile(filePath, data) {
    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  static async readJsonFile(filePath) {
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      return null;
    }
  }

  static async copyFile(src, dest) {
    await this.ensureDirectory(path.dirname(dest));
    await fs.copy(src, dest);
  }

  static async writeFile(filePath, content) {
    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  static formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  static formatDate(dateString) {
    return moment(dateString).format('MMM DD, YYYY');
  }

  static formatRelativeDate(dateString) {
    return moment(dateString).fromNow();
  }

  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }

  static sanitizeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static extractRepoInfo(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    return null;
  }

  static calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  static sortByScore(repositories) {
    return repositories.sort((a, b) => {
      if (b.qualityScore.total !== a.qualityScore.total) {
        return b.qualityScore.total - a.qualityScore.total;
      }
      return b.stargazers_count - a.stargazers_count;
    });
  }

  static groupByCategory(repositories, categories) {
    const grouped = {};
    
    Object.keys(categories).forEach(categoryId => {
      grouped[categoryId] = {
        ...categories[categoryId],
        repositories: []
      };
    });

    repositories.forEach(repo => {
      if (repo.category && grouped[repo.category]) {
        grouped[repo.category].repositories.push(repo);
      }
    });

    return grouped;
  }

  static generateStats(repositories) {
    const totalRepos = repositories.length;
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    const gradeDistribution = repositories.reduce((dist, repo) => {
      const grade = repo.qualityScore.grade;
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, {});

    const languageDistribution = repositories.reduce((dist, repo) => {
      const lang = repo.language || 'Unknown';
      dist[lang] = (dist[lang] || 0) + 1;
      return dist;
    }, {});

    const averageScore = totalRepos > 0 
      ? Math.round(repositories.reduce((sum, repo) => sum + repo.qualityScore.total, 0) / totalRepos)
      : 0;

    return {
      totalRepositories: totalRepos,
      totalStars,
      totalForks,
      averageScore,
      gradeDistribution,
      languageDistribution,
      lastUpdated: moment().toISOString()
    };
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static logProgress(current, total, message) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r[${progressBar}] ${percentage}% - ${message}`);
    
    if (current === total) {
      console.log('\n');
    }
  }

  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = Helpers;
