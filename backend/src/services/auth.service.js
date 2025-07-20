const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/amazon-sp-api');

class AuthService {
  constructor() {
    this.tokenCache = new Map();
    this.tokenExpiry = new Map();
  }

  /**
   * Generate a JWT token for API authentication
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {Object} options - JWT options
   * @returns {string} JWT token
   */
  generateToken(payload, secret = process.env.JWT_SECRET || 'your-secret-key', options = {}) {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'amazon-sp-api-backend',
      audience: 'amazon-sp-api-client'
    };

    const tokenOptions = { ...defaultOptions, ...options };
    return jwt.sign(payload, secret, tokenOptions);
  }

  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded token payload
   */
  verifyToken(token, secret = process.env.JWT_SECRET || 'your-secret-key') {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Validate Amazon SP API configuration
   * @returns {Object} Validation result
   */
  validateConfig() {
    const requiredFields = [
      'refresh_token',
      'lwa_app_id',
      'lwa_client_secret',
      'aws_access_key_id',
      'aws_secret_access_key',
      'role_arn'
    ];

    const missingFields = requiredFields.filter(field => !config[field]);
    const warnings = [];

    if (missingFields.length > 0) {
      warnings.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!config.marketplace_ids || config.marketplace_ids.length === 0) {
      warnings.push('No marketplace IDs configured');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
      config: {
        region: config.region,
        sandbox: config.sandbox,
        marketplaceCount: config.marketplace_ids?.length || 0
      }
    };
  }

  /**
   * Generate a secure random string
   * @param {number} length - Length of the string
   * @returns {string} Random string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a string using SHA-256
   * @param {string} input - String to hash
   * @returns {string} Hashed string
   */
  hashString(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Create a cache key for API responses
   * @param {string} operation - API operation
   * @param {Object} params - Operation parameters
   * @returns {string} Cache key
   */
  createCacheKey(operation, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${operation}:${this.hashString(JSON.stringify(sortedParams))}`;
  }

  /**
   * Check if a cached response is still valid
   * @param {string} cacheKey - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid(cacheKey, ttl = 300) { // 5 minutes default TTL
    const expiry = this.tokenExpiry.get(cacheKey);
    if (!expiry) return false;
    
    return Date.now() < expiry;
  }

  /**
   * Set cache with expiry
   * @param {string} cacheKey - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   */
  setCache(cacheKey, data, ttl = 300) {
    this.tokenCache.set(cacheKey, data);
    this.tokenExpiry.set(cacheKey, Date.now() + (ttl * 1000));
  }

  /**
   * Get cached data
   * @param {string} cacheKey - Cache key
   * @returns {*} Cached data or null
   */
  getCache(cacheKey) {
    if (!this.isCacheValid(cacheKey)) {
      this.tokenCache.delete(cacheKey);
      this.tokenExpiry.delete(cacheKey);
      return null;
    }
    return this.tokenCache.get(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.tokenCache.clear();
    this.tokenExpiry.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.tokenCache.size,
      keys: Array.from(this.tokenCache.keys()),
      expiries: Array.from(this.tokenExpiry.entries())
    };
  }
}

module.exports = new AuthService(); 