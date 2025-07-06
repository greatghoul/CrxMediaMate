// awsConfig.js - AWS 配置管理

// AWS 配置类
class AWSConfig {
  constructor() {
    this.loadConfig();
  }
  
  // 从存储加载配置
  loadConfig() {
    const stored = localStorage.getItem('aws_polly_config');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        this.region = config.region || 'us-east-1';
        this.accessKeyId = config.accessKeyId || '';
        this.secretAccessKey = config.secretAccessKey || '';
        this.voiceId = config.voiceId || 'Zhiyu';
      } catch (error) {
        console.error('加载 AWS 配置失败:', error);
        this.setDefaults();
      }
    } else {
      this.setDefaults();
    }
  }
  
  // 设置默认值
  setDefaults() {
    this.region = 'us-east-1';
    this.accessKeyId = '';
    this.secretAccessKey = '';
    this.voiceId = 'Zhiyu'; // 中文女声
  }
  
  // 保存配置
  saveConfig() {
    const config = {
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      voiceId: this.voiceId
    };
    localStorage.setItem('aws_polly_config', JSON.stringify(config));
  }
  
  // 检查配置是否完整
  isConfigured() {
    return this.accessKeyId && this.secretAccessKey;
  }
  
  // 获取所有配置
  getConfig() {
    return {
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      voiceId: this.voiceId
    };
  }
  
  // 更新配置
  updateConfig(newConfig) {
    if (newConfig.region) this.region = newConfig.region;
    if (newConfig.accessKeyId) this.accessKeyId = newConfig.accessKeyId;
    if (newConfig.secretAccessKey) this.secretAccessKey = newConfig.secretAccessKey;
    if (newConfig.voiceId) this.voiceId = newConfig.voiceId;
    this.saveConfig();
  }
}

// 导出单例实例
export const awsConfig = new AWSConfig();

// AWS 签名版本 4 实现
export class AWSSignatureV4 {
  constructor(accessKeyId, secretAccessKey, region, service) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.service = service;
  }
  
  // 创建签名
  async sign(method, url, headers = {}, body = '') {
    const urlObj = new URL(url);
    const host = urlObj.host;
    const pathname = urlObj.pathname;
    const search = urlObj.search;
    
    // 创建规范化请求
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = timestamp.substr(0, 8);
    
    const canonicalHeaders = this.createCanonicalHeaders({
      ...headers,
      'host': host,
      'x-amz-date': timestamp
    });
    
    const signedHeaders = Object.keys(canonicalHeaders).sort().join(';');
    
    // 计算 payload hash
    const payloadHash = await this.sha256(body);
    
    // 创建规范化请求字符串
    const canonicalRequest = [
      method,
      pathname,
      search.slice(1), // 移除 '?'
      Object.keys(canonicalHeaders).sort().map(key => `${key}:${canonicalHeaders[key]}`).join('\n'),
      '',
      signedHeaders,
      payloadHash
    ].join('\n');
    
    // 创建字符串待签名
    const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      credentialScope,
      await this.sha256(canonicalRequest)
    ].join('\n');
    
    // 计算签名
    const signature = await this.calculateSignature(stringToSign, date);
    
    // 创建授权头
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      'Authorization': authorization,
      'X-Amz-Date': timestamp,
      'Host': host
    };
  }
  
  // 创建规范化头部
  createCanonicalHeaders(headers) {
    const canonical = {};
    for (const [key, value] of Object.entries(headers)) {
      canonical[key.toLowerCase()] = value.toString().trim();
    }
    return canonical;
  }
  
  // SHA256 哈希
  async sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 计算签名
  async calculateSignature(stringToSign, date) {
    const encoder = new TextEncoder();
    
    // 创建签名密钥
    let key = encoder.encode(`AWS4${this.secretAccessKey}`);
    key = await this.hmacSha256(key, date);
    key = await this.hmacSha256(key, this.region);
    key = await this.hmacSha256(key, this.service);
    key = await this.hmacSha256(key, 'aws4_request');
    
    // 签名字符串
    const signature = await this.hmacSha256(key, stringToSign);
    
    // 转换为十六进制
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // HMAC-SHA256
  async hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyBuffer = key instanceof Uint8Array ? key : encoder.encode(key);
    const messageBuffer = typeof message === 'string' ? encoder.encode(message) : message;
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    return await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  }
}
