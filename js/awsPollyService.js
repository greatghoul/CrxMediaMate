// awsPollyService.js - Amazon Polly RESTful API 服务

import { awsAccessKeyId, awsSecretAccessKey } from './settings.js';

/**
 * AWS Signature Version 4 签名算法实现
 */
class AWSSignatureV4 {
  constructor(accessKeyId, secretAccessKey, region, service) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.service = service;
  }

  // 计算 SHA256 哈希
  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 计算 HMAC-SHA256
  async hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
    const messageBuffer = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
    return new Uint8Array(signature);
  }

  // 获取当前时间戳
  getTimestamp() {
    return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  }

  // 获取日期字符串
  getDateString() {
    return this.getTimestamp().substring(0, 8);
  }

  // 创建规范请求
  createCanonicalRequest(method, uri, queryString, headers, payload) {
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n') + '\n';

    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    return [
      method,
      uri,
      queryString,
      canonicalHeaders,
      signedHeaders,
      payload
    ].join('\n');
  }

  // 创建字符串以供签名
  createStringToSign(timestamp, canonicalRequest) {
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${this.getDateString()}/${this.region}/${this.service}/aws4_request`;
    
    return [
      algorithm,
      timestamp,
      credentialScope,
      this.sha256(canonicalRequest)
    ].join('\n');
  }

  // 计算签名
  async calculateSignature(stringToSign) {
    const kDate = await this.hmacSha256(`AWS4${this.secretAccessKey}`, this.getDateString());
    const kRegion = await this.hmacSha256(kDate, this.region);
    const kService = await this.hmacSha256(kRegion, this.service);
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    
    const signature = await this.hmacSha256(kSigning, stringToSign);
    return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 创建授权头
  async createAuthorizationHeader(method, uri, queryString, headers, payload) {
    const timestamp = this.getTimestamp();
    headers['x-amz-date'] = timestamp;

    const canonicalRequest = this.createCanonicalRequest(method, uri, queryString, headers, payload);
    const stringToSign = await this.createStringToSign(timestamp, canonicalRequest);
    const signature = await this.calculateSignature(stringToSign);

    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const credentialScope = `${this.getDateString()}/${this.region}/${this.service}/aws4_request`;
    
    return `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }
}

/**
 * Amazon Polly TTS 服务类
 */
export class AWSPollyService {
  constructor() {
    // 默认配置，用户只需要提供 accessKeyId 和 secretAccessKey
    this.config = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: "ap-southeast-1",
      voiceId: "Zhiyu",
      engine: "neural",
      outputFormat: "mp3",
      sampleRate: "22050",
      textType: "text",
      languageCode: "cmn-CN",
      enabled: true
    };
    
    this.baseUrl = `https://polly.${this.config.region}.amazonaws.com`;
    this.signer = new AWSSignatureV4(
      this.config.accessKeyId,
      this.config.secretAccessKey,
      this.config.region,
      'polly'
    );
  }

  /**
   * 检查 AWS Polly 配置是否有效
   */
  isConfigured() {
    return this.config.enabled && 
           this.config.accessKeyId && 
           this.config.secretAccessKey && 
           this.config.accessKeyId !== 'your-aws-access-key-id-here';
  }

  /**
   * 生成语音音频
   * @param {string} text - 要转换的文本
   * @returns {Promise<{audioBuffer: AudioBuffer, duration: number}>}
   */
  async synthesizeSpeech(text, audioContext) {
    if (!this.isConfigured()) {
      throw new Error('AWS Polly 未配置或已禁用');
    }

    if (!text || text.trim() === '') {
      // 返回3秒静音
      const duration = 3;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      return { audioBuffer: buffer, duration: duration * 1000 };
    }

    try {
      const requestBody = JSON.stringify({
        Text: text,
        VoiceId: this.config.voiceId,
        OutputFormat: this.config.outputFormat,
        SampleRate: this.config.sampleRate,
        TextType: this.config.textType
      });

      const headers = {
        'Content-Type': 'application/x-amz-json-1.0',
        'Host': `polly.${this.config.region}.amazonaws.com`,
        'Content-Length': requestBody.length.toString()
      };

      const payloadHash = await this.signer.sha256(requestBody);
      const authorization = await this.signer.createAuthorizationHeader(
        'POST',
        '/v1/speech',
        '',
        headers,
        payloadHash
      );

      headers['Authorization'] = authorization;

      const response = await fetch(`${this.baseUrl}/v1/speech`, {
        method: 'POST',
        headers: headers,
        body: requestBody
      });

      if (!response.ok) {
        throw new Error(`Polly API 错误: ${response.status} ${response.statusText}`);
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      const duration = audioBuffer.duration * 1000; // 转换为毫秒

      return {
        audioBuffer,
        duration: Math.max(duration, 3000) // 最少3秒
      };

    } catch (error) {
      console.error('Polly 语音合成失败:', error);
      throw error;
    }
  }

  /**
   * 批量生成语音
   * @param {Array<string>} texts - 文本数组
   * @param {AudioContext} audioContext - 音频上下文
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array<{audioBuffer: AudioBuffer, duration: number}>>}
   */
  async batchSynthesize(texts, audioContext, onProgress) {
    const results = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.synthesizeSpeech(texts[i], audioContext);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, texts.length);
        }
        
        // 添加小延迟避免 API 限制
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`生成第 ${i + 1} 个语音失败:`, error);
        // 失败时使用静音
        const duration = 3;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        results.push({ audioBuffer: buffer, duration: duration * 1000 });
      }
    }
    
    return results;
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      await this.synthesizeSpeech('测试', new AudioContext());
      return { success: true, message: 'AWS Polly 连接成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// 创建单例实例
export const pollyService = new AWSPollyService();
