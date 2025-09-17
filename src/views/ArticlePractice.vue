<template>
  <div class="practice-container">
    <div class="header">
      <div class="header-left">
        <el-button @click="goBack" type="primary" plain>
          <el-icon><ArrowLeft /></el-icon>
          返回菜单
        </el-button>
        <h2>文章练习</h2>
      </div>
      <div class="header-right">
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <el-button @click="saveProgress" type="success" plain>
          <el-icon><Check /></el-icon>
          保存进度
        </el-button>
      </div>
    </div>
    
    <div class="practice-content" v-if="articles.length > 0">
      <div class="article-section">
        <div 
          v-for="article in articles" 
          :key="article.id"
          class="article-item"
        >
          <h3 class="article-title">{{ article.title }}</h3>
          
          <div class="article-display">
            <!-- 提示横幅 -->
            <div class="pinyin-hint-banner" v-if="!showPinyin">
              <el-alert
                title="💡 学习提示"
                description="点击下方文章内容可以查看拼音标注，帮助您更好地学习发音"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
            
            <div 
              class="article-text"
              @click="togglePinyin"
              :class="{ 'show-pinyin': showPinyin }"
            >
              <div class="content-text">{{ article.content }}</div>
              <div class="pinyin-text" v-show="showPinyin">
                {{ article.pinyin }}
              </div>
              
              <!-- 悬浮提示 -->
              <div class="click-hint-overlay" v-if="!showPinyin">
                <el-icon class="hint-icon"><View /></el-icon>
                <span>点击查看拼音</span>
              </div>
            </div>
            
            <!-- 隐藏拼音的提示 -->
            <div class="hide-pinyin-hint" v-if="showPinyin">
              <el-button @click="togglePinyin" type="info" text size="small">
                <el-icon><Hide /></el-icon>
                隐藏拼音
              </el-button>
            </div>
          </div>
          
          <div class="input-section">
            <div class="input-label">请输入文章中的汉字内容（忽略标点符号）：</div>
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="6"
              placeholder="请在此输入文章中的汉字，标点符号可以忽略..."
              @input="checkInput"
              :class="{
                'correct': inputState === 'correct',
                'incorrect': inputState === 'incorrect'
              }"
              resize="none"
            />
            <div class="input-status">
              <div class="status-indicator">
                <el-icon v-if="inputState === 'correct'" class="correct-icon">
                  <Check />
                </el-icon>
                <el-icon v-if="inputState === 'incorrect'" class="incorrect-icon">
                  <Close />
                </el-icon>
                <span v-if="inputState === 'correct'" class="status-text correct-text">
                  完全正确！
                </span>
                <span v-else-if="inputState === 'incorrect'" class="status-text incorrect-text">
                  请检查汉字输入
                </span>
                <span v-else-if="inputState === 'partial'" class="status-text partial-text">
                  基本正确，继续加油！
                </span>
              </div>
              
              <div class="input-stats" v-if="matchResult">
                <span class="stat-correct">正确: {{ matchResult.correctCount }}字</span>
                <span class="stat-wrong" v-if="matchResult.wrongCount > 0">错误: {{ matchResult.wrongCount }}字</span>
                <span class="stat-missing" v-if="matchResult.missingCount > 0">遗漏: {{ matchResult.missingCount }}字</span>
                <span class="stat-extra" v-if="matchResult.extraCount > 0">多余: {{ matchResult.extraCount }}字</span>
                <span class="stat-accuracy">准确率: {{ Math.round(similarity * 100) }}%</span>
              </div>
            </div>
            
            <!-- 详细匹配结果 -->
            <div class="match-details" v-if="matchResult && matchResult.matchDetails.length > 0">
              <div class="details-title">逐字检查结果：</div>
              <div class="character-grid">
                <div 
                  v-for="(detail, index) in matchResult.matchDetails" 
                  :key="index"
                  class="character-item"
                  :class="`status-${detail.status}`"
                >
                  <div class="char-position">{{ index + 1 }}</div>
                  <div class="char-comparison">
                    <span class="user-char">{{ detail.userChar || '—' }}</span>
                    <span class="vs">vs</span>
                    <span class="correct-char">{{ detail.correctChar || '—' }}</span>
                  </div>
                  <div class="char-status">
                    <el-tag 
                      :type="detail.status === 'correct' ? 'success' : 
                            detail.status === 'wrong' ? 'danger' : 
                            detail.status === 'missing' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ detail.status === 'correct' ? '✓' : 
                         detail.status === 'wrong' ? '✗' : 
                         detail.status === 'missing' ? '缺' : '多' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="navigation">
        <el-button 
          @click="previousPage" 
          :disabled="currentPage <= 1"
          size="large"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一页
        </el-button>
        
        <div class="progress-stats">
          <span>准确度: {{ accuracy }}%</span>
          <span>相似度: {{ Math.round(similarity * 100) }}%</span>
          <span v-if="inputState === 'correct'" class="completion-badge">
            ✓ 已完成
          </span>
        </div>
        
        <el-button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages"
          size="large"
          type="primary"
        >
          下一页
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div v-else class="loading">
      <el-loading-spinner size="large" />
      <p>正在加载文章...</p>
    </div>
    
    <!-- 音频元素 -->
    <audio ref="correctAudio" preload="auto">
      <source :src="correctSound" type="audio/mpeg">
    </audio>
    <audio ref="incorrectAudio" preload="auto">
      <source :src="incorrectSound" type="audio/mpeg">
    </audio>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Close, View, Hide } from '@element-plus/icons-vue'
import { practiceAPI } from '../utils/api'

export default {
  name: 'ArticlePractice',
  components: {
    ArrowLeft,
    ArrowRight,
    Check,
    Close,
    View,
    Hide
  },
  setup() {
    const router = useRouter()
    const articles = ref([])
    const currentPage = ref(1)
    const totalPages = ref(1)
    const userInput = ref('')
    const inputState = ref('')
    const showPinyin = ref(false)
    const correctAudio = ref(null)
    const incorrectAudio = ref(null)
    const similarity = ref(0)
    const matchResult = ref(null)
    
    // 创建音频数据URL
    const correctSound = ref('')
    const incorrectSound = ref('')
    
    const accuracy = computed(() => {
      if (!userInput.value || !articles.value[0]?.content) return 0
      
      const userText = userInput.value.trim()
      const correctText = articles.value[0].content
      
      if (userText === correctText) return 100
      
      // 计算字符级别的准确度
      let matches = 0
      const minLength = Math.min(userText.length, correctText.length)
      
      for (let i = 0; i < minLength; i++) {
        if (userText[i] === correctText[i]) {
          matches++
        }
      }
      
      return Math.round((matches / Math.max(userText.length, correctText.length)) * 100)
    })
    
    const createAudioDataUrl = (frequency, duration = 0.2) => {
      const sampleRate = 44100
      const numSamples = sampleRate * duration
      const buffer = new ArrayBuffer(44 + numSamples * 2)
      const view = new DataView(buffer)
      
      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }
      
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + numSamples * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, numSamples * 2, true)
      
      // Audio data
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(frequency * 2 * Math.PI * i / sampleRate) * 0.3
        view.setInt16(44 + i * 2, sample * 32767, true)
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' })
      return URL.createObjectURL(blob)
    }
    
    const calculateSimilarity = (text1, text2) => {
      if (!text1 || !text2) return 0
      
      const len1 = text1.length
      const len2 = text2.length
      const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0))
      
      for (let i = 0; i <= len1; i++) matrix[0][i] = i
      for (let j = 0; j <= len2; j++) matrix[j][0] = j
      
      for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
          if (text1[i - 1] === text2[j - 1]) {
            matrix[j][i] = matrix[j - 1][i - 1]
          } else {
            matrix[j][i] = Math.min(
              matrix[j - 1][i] + 1,
              matrix[j][i - 1] + 1,
              matrix[j - 1][i - 1] + 1
            )
          }
        }
      }
      
      const distance = matrix[len2][len1]
      const maxLen = Math.max(len1, len2)
      return maxLen === 0 ? 1 : (maxLen - distance) / maxLen
    }
    
    const loadArticles = async (page = 1) => {
      try {
        const response = await practiceAPI.getArticles(page)
        articles.value = response.data.articles
        currentPage.value = response.data.page
        totalPages.value = response.data.total_pages
        
        // 重置状态
        userInput.value = ''
        inputState.value = ''
        showPinyin.value = false
        similarity.value = 0
        matchResult.value = null
      } catch (error) {
        console.error('加载文章失败:', error)
        ElMessage.error('加载文章失败')
      }
    }
    
    const loadProgress = async () => {
      try {
        const response = await practiceAPI.getProgress('article')
        const savedPage = response.data.page
        if (savedPage > 1) {
          currentPage.value = savedPage
          await loadArticles(savedPage)
        } else {
          await loadArticles(1)
        }
      } catch (error) {
        console.error('加载进度失败:', error)
        await loadArticles(1)
      }
    }
    
    // 提取汉字的函数
    const extractChineseCharacters = (text) => {
      // 匹配汉字的正则表达式
      const chineseRegex = /[\u4e00-\u9fff]/g
      return text.match(chineseRegex) || []
    }
    
    // 计算逐字匹配结果
    const calculateCharacterMatching = (userChars, correctChars) => {
      const result = {
        correctCount: 0,
        wrongCount: 0,
        missingCount: 0,
        extraCount: 0,
        matchDetails: []
      }
      
      const maxLength = Math.max(userChars.length, correctChars.length)
      
      // 逐字对比
      for (let i = 0; i < maxLength; i++) {
        const userChar = userChars[i] || null
        const correctChar = correctChars[i] || null
        
        if (userChar && correctChar) {
          if (userChar === correctChar) {
            result.correctCount++
            result.matchDetails.push({
              position: i,
              userChar,
              correctChar,
              status: 'correct'
            })
          } else {
            result.wrongCount++
            result.matchDetails.push({
              position: i,
              userChar,
              correctChar,
              status: 'wrong'
            })
          }
        } else if (correctChar && !userChar) {
          result.missingCount++
          result.matchDetails.push({
            position: i,
            userChar: null,
            correctChar,
            status: 'missing'
          })
        } else if (userChar && !correctChar) {
          result.extraCount++
          result.matchDetails.push({
            position: i,
            userChar,
            correctChar: null,
            status: 'extra'
          })
        }
      }
      
      return result
    }
    
    const checkInput = () => {
      if (!articles.value[0]?.content) return
      
      const userText = userInput.value.trim()
      const correctText = articles.value[0].content
      
      if (userText === '') {
        inputState.value = ''
        similarity.value = 0
        matchResult.value = null
        return
      }
      
      // 提取汉字进行逐字匹配
      const userChineseChars = extractChineseCharacters(userText)
      const correctChineseChars = extractChineseCharacters(correctText)
      
      // 计算逐字匹配结果
      const result = calculateCharacterMatching(userChineseChars, correctChineseChars)
      matchResult.value = result
      
      // 计算准确率
      const totalChars = correctChineseChars.length
      const accuracy = totalChars > 0 ? (result.correctCount / totalChars) : 0
      similarity.value = accuracy
      
      // 判断输入状态
      if (result.correctCount === totalChars && result.wrongCount === 0 && result.extraCount === 0) {
        // 完全正确
        inputState.value = 'correct'
        playCorrectSound()
      } else if (accuracy >= 0.8 && result.wrongCount <= 2) {
        // 基本正确（80%以上正确且错误不超过2个字）
        inputState.value = 'partial'
      } else {
        // 需要修正
        inputState.value = 'incorrect'
        playIncorrectSound()
      }
    }
    
    const togglePinyin = () => {
      showPinyin.value = !showPinyin.value
    }
    
    const playCorrectSound = () => {
      if (correctAudio.value) {
        correctAudio.value.currentTime = 0
        correctAudio.value.play().catch(() => {})
      }
    }
    
    const playIncorrectSound = () => {
      if (incorrectAudio.value) {
        incorrectAudio.value.currentTime = 0
        incorrectAudio.value.play().catch(() => {})
      }
    }
    
    const previousPage = async () => {
      if (currentPage.value > 1) {
        await loadArticles(currentPage.value - 1)
      }
    }
    
    const nextPage = async () => {
      if (currentPage.value < totalPages.value) {
        await loadArticles(currentPage.value + 1)
      }
    }
    
    const saveProgress = async () => {
      try {
        await practiceAPI.saveProgress('article', currentPage.value)
        ElMessage.success('进度已保存')
      } catch (error) {
        console.error('保存进度失败:', error)
        ElMessage.error('保存进度失败')
      }
    }
    
    const goBack = () => {
      router.push('/menu')
    }
    
    onMounted(async () => {
      // 创建音频
      correctSound.value = createAudioDataUrl(800) // 高音调表示正确
      incorrectSound.value = createAudioDataUrl(300) // 低音调表示错误
      
      await nextTick()
      await loadProgress()
    })
    
    return {
      articles,
      currentPage,
      totalPages,
      userInput,
      inputState,
      showPinyin,
      correctAudio,
      incorrectAudio,
      correctSound,
      incorrectSound,
      similarity,
      matchResult,
      accuracy,
      checkInput,
      togglePinyin,
      previousPage,
      nextPage,
      saveProgress,
      goBack
    }
  }
}
</script>

<style scoped>
.practice-container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.page-info {
  color: #7f8c8d;
  font-weight: 500;
}

.practice-content {
  max-width: 1000px;
  margin: 0 auto;
}

.article-section {
  margin-bottom: 40px;
}

.article-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.article-title {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.article-display {
  margin-bottom: 30px;
}

.pinyin-hint-banner {
  margin-bottom: 20px;
}

.pinyin-hint-banner :deep(.el-alert) {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
}

.pinyin-hint-banner :deep(.el-alert__title) {
  color: #667eea;
  font-weight: 600;
}

.pinyin-hint-banner :deep(.el-alert__description) {
  color: #7f8c8d;
}

.article-text {
  cursor: pointer;
  padding: 25px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px dashed #e0e0e0;
  position: relative;
  overflow: hidden;
}

.article-text:hover {
  background: rgba(102, 126, 234, 0.05);
  border-color: #667eea;
}

.article-text.show-pinyin {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  border-style: solid;
}

.content-text {
  font-size: 18px;
  line-height: 1.8;
  color: #2c3e50;
  margin-bottom: 15px;
}

.pinyin-text {
  font-size: 16px;
  color: #667eea;
  line-height: 1.6;
  font-weight: 500;
  border-top: 1px solid rgba(102, 126, 234, 0.2);
  padding-top: 15px;
}

.click-hint-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(102, 126, 234, 0.9);
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.article-text:hover .click-hint-overlay {
  opacity: 1;
}

.hint-icon {
  font-size: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.hide-pinyin-hint {
  text-align: center;
  margin-top: 15px;
}

.click-hint {
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  margin-top: 10px;
  font-style: italic;
}

.input-section {
  position: relative;
}

.input-label {
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 10px;
  font-size: 16px;
}

.input-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.correct-icon {
  color: #67c23a;
  font-size: 18px;
}

.incorrect-icon {
  color: #f56c6c;
  font-size: 18px;
}

.status-text {
  font-weight: 500;
  font-size: 14px;
}

.correct-text {
  color: #67c23a;
}

.incorrect-text {
  color: #f56c6c;
}

.partial-text {
  color: #e6a23c;
}

.input-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  flex-wrap: wrap;
}

.stat-correct {
  color: #67c23a;
  font-weight: 500;
}

.stat-wrong {
  color: #f56c6c;
  font-weight: 500;
}

.stat-missing {
  color: #e6a23c;
  font-weight: 500;
}

.stat-extra {
  color: #909399;
  font-weight: 500;
}

.stat-accuracy {
  color: #409eff;
  font-weight: 600;
}

.match-details {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #409eff;
}

.details-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 14px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.character-item {
  background: white;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.character-item.status-correct {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.character-item.status-wrong {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.character-item.status-missing {
  border-color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
}

.character-item.status-extra {
  border-color: #909399;
  background: rgba(144, 147, 153, 0.1);
}

.char-position {
  font-size: 10px;
  color: #909399;
  margin-bottom: 4px;
}

.char-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 16px;
  font-weight: 600;
}

.user-char {
  color: #2c3e50;
  min-width: 20px;
}

.vs {
  font-size: 10px;
  color: #909399;
}

.correct-char {
  color: #67c23a;
  min-width: 20px;
}

.char-status {
  display: flex;
  justify-content: center;
}

:deep(.el-textarea.correct .el-textarea__inner) {
  border-color: #67c23a;
  box-shadow: 0 0 0 1px #67c23a;
}

:deep(.el-textarea.incorrect .el-textarea__inner) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px #f56c6c;
}

:deep(.el-textarea__inner) {
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.6;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.progress-stats {
  display: flex;
  gap: 20px;
  color: #7f8c8d;
  font-weight: 500;
  align-items: center;
}

.completion-badge {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 100px 0;
  color: white;
}

.loading p {
  margin-top: 20px;
  font-size: 16px;
}
</style>
