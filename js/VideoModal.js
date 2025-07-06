// VideoModal.js - 视频生成模态框组件

import { html, useState, useEffect } from './preact.js';

// 视频生成模态框
const VideoModal = ({ isOpen, images, onClose }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 生成视频
  const generateVideo = async () => {
    if (!images || images.length === 0) return;
    
    setLoading(true);
    
    try {
      // 创建视频轨道
      const track = await createImageTrack(images);
      
      // 创建视频文件
      const videoBlob = await createVideoFromTrack(track);
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
    } catch (error) {
      console.error('视频生成失败:', error);
      alert('视频生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建图片轨道
  const createImageTrack = async (images) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 获取第一张图片尺寸作为视频尺寸
    const firstImage = await loadImage(images[0].imageData);
    canvas.width = firstImage.width;
    canvas.height = firstImage.height;
    
    // 创建视频流
    const stream = canvas.captureStream(30);
    const videoTrack = stream.getVideoTracks()[0];
    
    // 为每张图片添加5秒显示
    for (const image of images) {
      const img = await loadImage(image.imageData);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 等待5秒
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return videoTrack;
  };
  
  // 加载图片
  const loadImage = (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(blob);
    });
  };
  
  // 从轨道创建视频
  const createVideoFromTrack = (track) => {
    return new Promise((resolve) => {
      const recorder = new MediaRecorder(new MediaStream([track]), {
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000
      });
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        if (chunks.length > 0) {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        } else {
          throw new Error('No video data available');
        }
      };
      
      recorder.start(100); // 每100ms收集一次数据
      setTimeout(() => {
        try {
          recorder.stop();
        } catch (error) {
          console.error('Error stopping recorder:', error);
          resolve(null);
        }
      }, images.length * 5000); // 总时长 = 图片数量 * 5秒
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
              </div>
            ` : videoUrl ? html`
              <div class="video-container" style="max-width: 100%; overflow: hidden;">
                <video controls autoplay style="max-width: 100%; height: auto;">
                  <source src=${videoUrl} type="video/webm" />
                </video>
              </div>
            ` : html`
              <div class="text-center text-muted">
                <p>视频生成失败</p>
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
