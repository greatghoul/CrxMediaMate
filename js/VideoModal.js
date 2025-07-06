// VideoModal.js - 视频生成模态框组件

import { html, useState, useEffect } from './preact.js';
import { pollyService } from './awsPollyService.js';

// 视频生成模态框
const VideoModal = ({ isOpen, images, onClose }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // 初始化音频上下文
  useEffect(() => {
    if (isOpen && !audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, [isOpen]);
  
  // 生成视频
  const generateVideo = async () => {
    if (!images || images.length === 0) return;
    
    // 检查 Polly 配置
    if (!pollyService.isConfigured()) {
      alert('Amazon Polly 未配置，请在 settings.js 中设置 AWS 凭证（awsAccessKeyId 和 awsSecretAccessKey）');
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setStatusMessage('初始化...');
    
    try {
      // 使用带语音的视频生成方法
      const videoBlob = await createVideoFromImages(images);
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setStatusMessage('');
    } catch (error) {
      console.error('视频生成失败:', error);
      if (error.message.includes('Amazon Polly')) {
        alert('Amazon Polly 配置有误，请检查 settings.js 中的 AWS 凭证是否正确');
      } else {
        alert('视频生成失败，请重试: ' + error.message);
      }
      setStatusMessage('');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  // 生成语音音频（始终使用 Amazon Polly）
  const generateSpeechAudio = async (text) => {
    // 确保音频上下文可用
    let currentAudioContext = audioContext;
    if (!currentAudioContext) {
      currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(currentAudioContext);
    }
    
    if (!text || text.trim() === '') {
      // 返回3秒静音
      const duration = 3;
      const sampleRate = currentAudioContext.sampleRate;
      const buffer = currentAudioContext.createBuffer(1, duration * sampleRate, sampleRate);
      return { audioBuffer: buffer, duration: duration * 1000 };
    }
    
    // 检查 Polly 是否配置
    if (!pollyService.isConfigured()) {
      throw new Error('Amazon Polly 未配置，请在 settings.js 中设置 AWS 凭证');
    }
    
    setStatusMessage(`使用 Amazon Polly 生成语音: ${text.substring(0, 20)}...`);
    return await pollyService.synthesizeSpeech(text, currentAudioContext);
  };
  
  // 从图片创建视频（带语音）
  const createVideoFromImages = async (images) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置超高清视频尺寸 (16:9) - 使用4K分辨率
    const videoWidth = 3840;   // 4K分辨率
    const videoHeight = 2160;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // 设置画布高质量渲染（不使用DPR缩放，因为这是用于视频录制）
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 预先生成所有语音音频
    const speechData = [];
    setProgress(10);
    setStatusMessage('生成语音音频...');
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const speech = await generateSpeechAudio(image.caption);
      speechData.push(speech);
      setProgress(10 + (i / images.length) * 30); // 10-40%用于语音生成
    }
    
    // 创建视频流 - 使用更高帧率
    const stream = canvas.captureStream(30); // 30fps
    
    // 创建并添加音频轨道（包含背景音乐）
    setStatusMessage('混合音频轨道...');
    setProgress(40);
    const audioTrack = await createMixedAudioTrack(speechData);
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
    setProgress(50);
    
    // 检查VP9编码器支持，如果不支持则使用VP8
    let mediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 25000000,  // 25Mbps for 4K
      audioBitsPerSecond: 320000     // 320kbps for high quality audio
    };
    
    if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      console.log('VP9编码器不支持，使用VP8');
      mediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 20000000,  // 20Mbps for VP8 4K
        audioBitsPerSecond: 320000
      };
    }
    
    const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
    
    const chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        if (chunks.length > 0) {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        } else {
          reject(new Error('No video data recorded'));
        }
      };
      
      mediaRecorder.onerror = (error) => {
        reject(error);
      };
      
      // 开始录制
      mediaRecorder.start();
      
      // 渲染图片序列
      renderImageSequenceWithAudio(images, speechData, canvas, ctx, () => {
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 500);
      });
    });
  };
  
  // 创建混合音频轨道
  const createMixedAudioTrack = async (speechDataArray) => {
    try {
      // 确保音频上下文可用
      let currentAudioContext = audioContext;
      if (!currentAudioContext) {
        currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(currentAudioContext);
      }
      
      // 加载背景音乐
      const backgroundMusic = await loadBackgroundMusic();
      
      // 计算总时长
      const totalDuration = speechDataArray.reduce((sum, speech) => sum + speech.duration, 0) / 1000;
      
      // 创建主音频缓冲区
      const sampleRate = currentAudioContext.sampleRate;
      const totalSamples = Math.ceil(totalDuration * sampleRate);
      const mixedBuffer = currentAudioContext.createBuffer(2, totalSamples, sampleRate); // 立体声
      
      // 先添加背景音乐（低音量）
      if (backgroundMusic) {
        const backgroundVolume = 0.15; // 15%音量，避免盖住语音
        const musicDuration = backgroundMusic.duration;
        
        for (let channel = 0; channel < 2; channel++) {
          const mixedChannelData = mixedBuffer.getChannelData(channel);
          const musicChannelData = backgroundMusic.getChannelData(
            backgroundMusic.numberOfChannels === 1 ? 0 : channel
          );
          
          // 循环播放背景音乐直到视频结束
          for (let i = 0; i < totalSamples; i++) {
            const musicSampleIndex = Math.floor((i / sampleRate) % musicDuration * backgroundMusic.sampleRate);
            if (musicSampleIndex < musicChannelData.length) {
              mixedChannelData[i] = musicChannelData[musicSampleIndex] * backgroundVolume;
            }
          }
        }
      }
      
      // 混合语音音频（正常音量）
      let currentOffset = 0;
      for (const speechData of speechDataArray) {
        if (speechData.audioBuffer) {
          const startSample = Math.floor(currentOffset * sampleRate / 1000);
          
          // 处理单声道或立体声
          const sourceChannels = speechData.audioBuffer.numberOfChannels;
          const sourceSampleRate = speechData.audioBuffer.sampleRate;
          
          for (let channel = 0; channel < 2; channel++) {
            const mixedChannelData = mixedBuffer.getChannelData(channel);
            const sourceChannelData = speechData.audioBuffer.getChannelData(
              sourceChannels === 1 ? 0 : channel
            );
            
            // 重采样（如果需要）
            const sampleRateRatio = sourceSampleRate / sampleRate;
            const sourceSamples = sourceChannelData.length;
            const targetSamples = Math.floor(sourceSamples / sampleRateRatio);
            
            for (let i = 0; i < targetSamples && (startSample + i) < mixedChannelData.length; i++) {
              const sourceIndex = Math.floor(i * sampleRateRatio);
              // 将语音音频叠加到背景音乐上
              mixedChannelData[startSample + i] += sourceChannelData[sourceIndex];
            }
          }
        }
        
        currentOffset += speechData.duration;
      }
      
      // 创建音频源和目标
      const source = currentAudioContext.createBufferSource();
      source.buffer = mixedBuffer;
      
      const destination = currentAudioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // 启动播放
      source.start();
      
      return destination.stream.getAudioTracks()[0];
    } catch (error) {
      console.error('创建音频轨道失败:', error);
      return null;
    }
  };
  
  // 渲染图片序列
  const renderImageSequenceWithAudio = async (images, speechData, canvas, ctx, onComplete) => {
    setStatusMessage('渲染视频...');
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const speech = speechData[i];
      
      try {
        // 加载图片
        const img = await loadImage(image);
        
        // 清空画布并设置超高质量渲染
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 设置最高质量图片渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalCompositeOperation = 'source-over';
        
        // 绘制图片 - 使用最高质量算法
        const { x, y, width, height } = calculateImagePosition(img, canvas.width, canvas.height);
        
        // 如果图片需要缩放，使用多步缩放以提高质量
        if (img.width > width || img.height > height) {
          // 创建临时canvas进行高质量缩放
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          // 设置临时canvas尺寸
          tempCanvas.width = width;
          tempCanvas.height = height;
          
          // 高质量缩放设置
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          
          // 多步缩放算法
          let currentWidth = img.width;
          let currentHeight = img.height;
          let currentCanvas = document.createElement('canvas');
          let currentCtx = currentCanvas.getContext('2d');
          
          currentCanvas.width = currentWidth;
          currentCanvas.height = currentHeight;
          currentCtx.drawImage(img, 0, 0);
          
          // 逐步缩放到目标尺寸
          while (currentWidth > width * 2 || currentHeight > height * 2) {
            currentWidth = Math.max(width, currentWidth * 0.5);
            currentHeight = Math.max(height, currentHeight * 0.5);
            
            const nextCanvas = document.createElement('canvas');
            const nextCtx = nextCanvas.getContext('2d');
            nextCanvas.width = currentWidth;
            nextCanvas.height = currentHeight;
            
            nextCtx.imageSmoothingEnabled = true;
            nextCtx.imageSmoothingQuality = 'high';
            nextCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight);
            
            currentCanvas = nextCanvas;
            currentCtx = nextCtx;
          }
          
          // 最终绘制到目标canvas
          tempCtx.drawImage(currentCanvas, 0, 0, width, height);
          ctx.drawImage(tempCanvas, x, y);
        } else {
          // 直接绘制原图
          ctx.drawImage(img, x, y, width, height);
        }
        
        // 等待语音播放时间
        const displayDuration = speech.duration;
        await new Promise(resolve => setTimeout(resolve, displayDuration));
        
        // 更新进度
        setProgress(50 + ((i + 1) / images.length) * 50);
        
      } catch (error) {
        console.error(`处理第 ${i + 1} 张图片失败:`, error);
        setStatusMessage(`处理第 ${i + 1} 张图片失败: ${error.message}`);
        
        // 显示错误帧
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('图片加载失败', canvas.width / 2, canvas.height / 2);
        ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 60);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    onComplete();
  };
  
  // 计算图片位置（保持比例）
  const calculateImagePosition = (img, canvasWidth, canvasHeight) => {
    const imgAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    let width, height, x, y;
    
    if (imgAspectRatio > canvasAspectRatio) {
      // 图片更宽，以宽度为准
      width = canvasWidth;
      height = canvasWidth / imgAspectRatio;
      x = 0;
      y = (canvasHeight - height) / 2;
    } else {
      // 图片更高，以高度为准
      height = canvasHeight;
      width = canvasHeight * imgAspectRatio;
      x = (canvasWidth - width) / 2;
      y = 0;
    }
    
    return { x, y, width, height };
  };
  
  // 加载图片
  const loadImage = (imageData) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 设置图片质量相关属性
      img.crossOrigin = 'anonymous';
      img.decoding = 'sync';  // 同步解码以确保质量
      
      img.onload = () => {
        // 确保图片完全加载
        if (img.complete && img.naturalWidth !== 0) {
          // 清理临时 URL
          if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
          }
          resolve(img);
        } else {
          reject(new Error('图片加载不完整'));
        }
      };
      img.onerror = (error) => {
        console.error('图片加载失败:', error);
        reject(new Error('图片加载失败'));
      };
      
      // 检查图片数据类型并相应处理
      if (imageData instanceof Blob) {
        // 直接传入 Blob
        img.src = URL.createObjectURL(imageData);
      } else if (typeof imageData === 'string') {
        // 如果是 data URL 或普通 URL
        img.src = imageData;
      } else if (imageData && imageData.imageData instanceof Blob) {
        // 图片对象，imageData 属性是 Blob（来自 IndexedDB）
        img.src = URL.createObjectURL(imageData.imageData);
      } else if (imageData && imageData.blob instanceof Blob) {
        // 图片对象，blob 属性是 Blob
        img.src = URL.createObjectURL(imageData.blob);
      } else if (imageData && typeof imageData.url === 'string') {
        // 图片对象，url 属性是字符串
        img.src = imageData.url;
      } else {
        console.error('无效的图片数据格式:', imageData);
        reject(new Error('无效的图片数据格式'));
      }
    });
  };
  
  // 加载背景音乐
  const loadBackgroundMusic = async () => {
    try {
      // 确保音频上下文可用
      let currentAudioContext = audioContext;
      if (!currentAudioContext) {
        currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(currentAudioContext);
      }
      
      const response = await fetch('audios/cute-happy-kids.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await currentAudioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('加载背景音乐失败:', error);
      return null;
    }
  };

  // 当模态框打开时生成视频
  useEffect(() => {
    if (isOpen) {
      generateVideo();
    } else {
      // 关闭时释放URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl('');
      }
    }
  }, [isOpen]);
  
  // 下载视频
  const handleDownload = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = '沙雕视频.webm';
    a.click();
  };
  
  if (!isOpen) return null;
  
  return html`
    <div class="modal show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">生成的视频</h5>
            <button type="button" class="btn-close" aria-label="Close" onClick=${onClose}></button>
          </div>
          <div class="modal-body">
            ${loading ? html`
              <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">生成视频中...</span>
                </div>
                <p class="mt-2">${statusMessage || '正在使用 Amazon Polly 生成视频，请稍候...'}</p>
                <div class="progress mt-3" style="height: 8px;">
                  <div 
                    class="progress-bar" 
                    role="progressbar" 
                    style="width: ${progress}%"
                    aria-valuenow="${progress}" 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <small class="text-muted">${Math.round(progress)}% 完成</small>
              </div>
            ` : videoUrl ? html`
              <div class="video-container" style="max-width: 100%; overflow: hidden;">
                <video controls style="max-width: 100%; height: auto;">
                  <source src=${videoUrl} type="video/webm" />
                  您的浏览器不支持视频播放
                </video>
                <div class="mt-3">
                  <small class="text-muted">
                    超高清视频（4K）包含 ${images ? images.length : 0} 张图片，配有 Amazon Polly 中文语音和背景音乐
                  </small>
                </div>
              </div>
            ` : html`
              <div class="text-center text-muted">
                <p>视频生成失败，请重试</p>
              </div>
            `}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>关闭</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              onClick=${handleDownload}
              disabled=${!videoUrl}
            >
              下载视频
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </div>
  `;
};

export default VideoModal;