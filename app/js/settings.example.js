/**
 * 项目配置模板
 */

// 生成文章时，需要在开头和结尾附加在段落内容, 如果不需要，可以设置为空字符串 ''
export const articleHeadParagraph = '<p>文章开头段落内容</p>';
export const articleTailParagraph = '<p>文章结尾段落内容</p>';

// 是否启用文字转语音功能（用于决定在生成视频时，是否对图片对应的描述文字进行配音）
export const ttsEnabled = false;

// AWS Polly Configuration for Text-to-Speech
// https://aws.amazon.com/cn/polly/
export const awsAccessKeyId = "your-aws-access-key-id-here";
export const awsSecretAccessKey = "your-aws-secret-access-key-here";
