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
            <div 
              class="article-text"
              @click="togglePinyin"
              :class="{ 'show-pinyin': showPinyin }"
            >
              <div class="content-text">{{ article.content }}</div>
              <div class="pinyin-text" v-show="showPinyin">
                {{ article.pinyin }}
              </div>
            </div>
            <div class="click-hint" v-if="!showPinyin">
              点击文章查看拼音
            </div>
          </div>
          
          <div class="input-section">
            <div class="input-label">请输入文章的内容：</div>
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="6"
              placeholder="请在此输入完整的文章内容..."
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
                  请检查拼音
                </span>
                <span v-else-if="similarity > 0" class="status-text partial-text">
                  相似度: {{ Math.round(similarity * 100) }}%
                </span>
              </div>
              
              <div class="input-stats">
                <span>字符数: {{ userInput.length }}</span>
                <span>目标长度: {{ articles[0]?.content?.length || 0 }}</span>
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
import { ArrowLeft, ArrowRight, Check, Close } from '@element-plus/icons-vue'
import { practiceAPI } from '../utils/api'

export default {
  name: 'ArticlePractice',
  components: {
    ArrowLeft,
    ArrowRight,
    Check,
    Close
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
    
    const checkInput = () => {
      if (!articles.value[0]?.content) return
      
      const userText = userInput.value.trim()
      const correctText = articles.value[0].content
      
      if (userText === '') {
        inputState.value = ''
        similarity.value = 0
        return
      }
      
      // 计算相似度
      similarity.value = calculateSimilarity(userText, correctText)
      
      if (userText === correctText) {
        inputState.value = 'correct'
        playCorrectSound()
      } else if (similarity.value < 0.8) {
        inputState.value = 'incorrect'
        playIncorrectSound()
      } else {
        inputState.value = 'partial'
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

.article-text {
  cursor: pointer;
  padding: 25px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px dashed #e0e0e0;
  position: relative;
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
  color: #7f8c8d;
  font-size: 12px;
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
