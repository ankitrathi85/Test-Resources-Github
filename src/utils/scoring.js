const moment = require('moment');

class QualityScorer {
  constructor() {
    this.maxPoints = 100;
  }

  calculateScore(repo, additionalData = {}) {
    const scores = {
      popularity: this.calculatePopularityScore(repo),
      activity: this.calculateActivityScore(repo, additionalData.commits, additionalData.releases),
      documentation: this.calculateDocumentationScore(repo, additionalData.readme, additionalData.hasWiki),
      community: this.calculateCommunityScore(repo, additionalData.hasLicense, additionalData.hasContributing),
      maintenance: this.calculateMaintenanceScore(repo, additionalData.releases),
      codeQuality: this.calculateCodeQualityScore(repo, additionalData.hasCI)
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const grade = this.calculateGrade(totalScore);

    return {
      total: Math.round(totalScore),
      grade,
      breakdown: scores,
      maxPoints: this.maxPoints
    };
  }

  calculatePopularityScore(repo) {
    // 25 points max: Stars (20) + Forks (5)
    const starScore = Math.min((repo.stargazers_count / 1000) * 10, 20);
    const forkScore = Math.min((repo.forks_count / 200) * 5, 5);
    
    return starScore + forkScore;
  }

  calculateActivityScore(repo, commits = [], releases = []) {
    // 20 points max: Recent commits (15) + Recent releases (5)
    const lastUpdate = moment(repo.pushed_at);
    const daysSinceUpdate = moment().diff(lastUpdate, 'days');
    
    // Recent commits score (15 points)
    let commitScore = 0;
    if (daysSinceUpdate <= 7) commitScore = 15;
    else if (daysSinceUpdate <= 30) commitScore = 12;
    else if (daysSinceUpdate <= 90) commitScore = 8;
    else if (daysSinceUpdate <= 180) commitScore = 4;
    else commitScore = 0;

    // Recent releases score (5 points)
    let releaseScore = 0;
    if (releases && releases.length > 0) {
      const latestRelease = moment(releases[0].published_at);
      const daysSinceRelease = moment().diff(latestRelease, 'days');
      
      if (daysSinceRelease <= 90) releaseScore = 5;
      else if (daysSinceRelease <= 180) releaseScore = 3;
      else if (daysSinceRelease <= 365) releaseScore = 1;
    }

    return commitScore + releaseScore;
  }

  calculateDocumentationScore(repo, readme = null, hasWiki = false) {
    // 20 points max: README quality (15) + Wiki/Docs (5)
    let readmeScore = 0;
    
    if (readme) {
      const content = Buffer.from(readme.content, 'base64').toString();
      const length = content.length;
      
      // Basic README score
      if (length > 500) readmeScore += 5;
      if (length > 2000) readmeScore += 3;
      if (length > 5000) readmeScore += 2;
      
      // Quality indicators
      if (content.includes('## ') || content.includes('# ')) readmeScore += 2; // Headers
      if (content.includes('```')) readmeScore += 2; // Code examples
      if (content.includes('[![') || content.includes('![')) readmeScore += 1; // Badges/Images
    }

    const wikiScore = hasWiki ? 5 : 0;
    
    return Math.min(readmeScore, 15) + wikiScore;
  }

  calculateCommunityScore(repo, hasLicense = false, hasContributing = false) {
    // 15 points max: License (8) + Contributing (4) + Issues/Community (3)
    const licenseScore = hasLicense ? 8 : 0;
    const contributingScore = hasContributing ? 4 : 0;
    
    // Community engagement score
    let communityScore = 0;
    if (repo.open_issues_count > 0 && repo.open_issues_count < 100) communityScore += 2;
    if (repo.has_issues) communityScore += 1;
    
    return licenseScore + contributingScore + communityScore;
  }

  calculateMaintenanceScore(repo, releases = []) {
    // 10 points max: Regular releases and maintenance patterns
    let score = 0;
    
    if (releases && releases.length > 0) {
      score += Math.min(releases.length, 5); // Up to 5 points for number of releases
      
      // Check for regular release pattern
      if (releases.length >= 3) {
        const releaseGaps = [];
        for (let i = 0; i < Math.min(releases.length - 1, 5); i++) {
          const gap = moment(releases[i].published_at).diff(moment(releases[i + 1].published_at), 'days');
          releaseGaps.push(gap);
        }
        
        const avgGap = releaseGaps.reduce((sum, gap) => sum + gap, 0) / releaseGaps.length;
        if (avgGap <= 90) score += 3; // Regular releases every ~3 months
        else if (avgGap <= 180) score += 2; // Semi-regular releases
        else score += 1;
      }
    }
    
    return Math.min(score, 10);
  }

  calculateCodeQualityScore(repo, hasCI = false) {
    // 10 points max: Topics (3) + CI/CD (4) + Not archived (3)
    let score = 0;
    
    // Topics/Keywords
    if (repo.topics && repo.topics.length > 0) {
      score += Math.min(repo.topics.length, 3);
    }
    
    // CI/CD presence
    if (hasCI) {
      score += 4;
    }
    
    // Repository status
    if (!repo.archived) score += 3;
    
    return score;
  }

  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  getGradeColor(grade) {
    const colors = {
      'A+': '#4CAF50', // Green
      'A': '#8BC34A',   // Light Green
      'B': '#FFC107',   // Amber
      'C': '#FF9800',   // Orange
      'D': '#FF5722',   // Deep Orange
      'F': '#F44336'    // Red
    };
    return colors[grade] || '#9E9E9E';
  }

  getScoreDescription(score) {
    if (score >= 90) return 'Exceptional quality with excellent documentation, active maintenance, and strong community support.';
    if (score >= 80) return 'High quality repository with good practices and regular maintenance.';
    if (score >= 70) return 'Good quality repository with decent documentation and community engagement.';
    if (score >= 60) return 'Average quality repository that meets basic standards.';
    if (score >= 50) return 'Below average quality with some areas needing improvement.';
    return 'Poor quality repository with significant issues or lack of maintenance.';
  }
}

// Create and export instance for easy access
const scorer = new QualityScorer();

module.exports = {
  QualityScorer,
  calculateQualityScore: (repo, additionalData) => scorer.calculateScore(repo, additionalData),
  scorer
};
