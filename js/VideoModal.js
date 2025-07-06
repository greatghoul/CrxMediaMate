// VideoModal.js - 视频生成模态框组件

import { html, useState, useEffect } from './preact.js';

// 视频生成模态框
const VideoModal = ({ isOpen, images, onClose }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // 生成视频
  const generateVideo = async () => {
    if (!images || images.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    
    try {
      // 使用新的视频生成方法
      const videoBlob = await createVideoFromImages(images);
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
    } catch (error) {
      console.error('视频生成失败:', error);
      alert('视频生成失败，请重试');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  // 从图片创建视频
  const createVideoFromImages = async (images) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置视频尺寸 - 使用固定尺寸确保兼容性
    canvas.width = 1280;
    canvas.height = 720;
    
    // 创建视频流
    const stream = canvas.captureStream(25); // 25fps
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 2500000
    });
    
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
      renderImageSequence(images, canvas, ctx, () => {
        // 录制完成后停止
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 500); // 给一点缓冲时间
      });
    });
  };
  
  // 渲染图片序列
  const renderImageSequence = async (images, canvas, ctx, onComplete) => {
    const imageDuration = 5000; // 每张图片显示5秒
    const fps = 25;
    const framesPerImage = Math.floor(imageDuration / 1000 * fps);
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      setProgress((i / images.length) * 100);
      
      try {
        const img = await loadImage(image.imageData);
        
        // 计算图片在画布中的位置和尺寸（保持比例）
        const { x, y, width, height } = calculateImagePosition(img, canvas.width, canvas.height);
        
        // 渲染当前图片的所有帧
        for (let frame = 0; frame < framesPerImage; frame++) {
          // 清空画布
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 绘制图片
          ctx.drawImage(img, x, y, width, height);
          
          // 添加图片描述文字
          // if (image.caption) {
          //   drawCaption(ctx, image.caption, canvas.width, canvas.height);
          // }
          
          // 等待下一帧
          await new Promise(resolve => setTimeout(resolve, 1000 / fps));
        }
      } catch (error) {
        console.error('Error processing image:', error);
        continue;
      }
    }
    
    setProgress(100);
    onComplete();
  };
  
  // 计算图片在画布中的位置（居中并保持比例）
  const calculateImagePosition = (img, canvasWidth, canvasHeight) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let width, height, x, y;
    
    if (imgRatio > canvasRatio) {
      // 图片较宽，以宽度为准
      width = canvasWidth;
      height = canvasWidth / imgRatio;
      x = 0;
      y = (canvasHeight - height) / 2;
    } else {
      // 图片较高，以高度为准
      height = canvasHeight;
      width = canvasHeight * imgRatio;
      x = (canvasWidth - width) / 2;
      y = 0;
    }
    
    return { x, y, width, height };
  };
  
  // 绘制图片描述文字
  const drawCaption = (ctx, caption, canvasWidth, canvasHeight) => {
    ctx.save();
    
    // 设置字体样式
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // 文字位置
    const x = canvasWidth / 2;
    const y = canvasHeight - 40;
    
    // 绘制文字描边和填充
    ctx.strokeText(caption, x, y);
    ctx.fillText(caption, x, y);
    
    ctx.restore();
  };
  
  // 加载图片
  const loadImage = (blob) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
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
                <p class="mt-2">正在生成视频，请稍候...</p>
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
                    视频包含 ${images ? images.length : 0} 张图片，每张图片显示 5 秒钟
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
