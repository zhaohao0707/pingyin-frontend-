<template>
  <div class="practice-container">
    <div class="header">
      <div class="header-left">
        <el-button @click="goBack" type="primary" plain>
          <el-icon><ArrowLeft /></el-icon>
          返回菜单
        </el-button>
        <h2>词语练习</h2>
      </div>
      <div class="header-right">
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <el-button @click="saveProgress" type="success" plain>
          <el-icon><Check /></el-icon>
          保存进度
        </el-button>
      </div>
    </div>
    
    <div class="practice-content" v-if="words.length > 0">
      <div class="instruction-banner">
        <el-alert
          title="练习说明"
          description="请在输入框中输入对应的汉字（如：看到'你好'，请输入'你好'）"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      
      <div class="words-grid">
        <div 
          v-for="(word, index) in words" 
          :key="word.id"
          class="word-item"
        >
          <div 
            class="word-display"
            @click="showPinyin(index)"
            :class="{ 'show-pinyin': showPinyinIndex === index }"
          >
            <div class="word-text">{{ word.word }}</div>
            <div class="pinyin-text" v-show="showPinyinIndex === index">
              {{ word.pinyin }}
            </div>
          </div>
          
          <div class="input-section">
            <el-input
              v-model="userInputs[index]"
              placeholder="请输入对应的汉字"
              @input="checkInput(index)"
              :class="{
                'correct': inputStates[index] === 'correct',
                'incorrect': inputStates[index] === 'incorrect'
              }"
              size="large"
            />
            <div class="status-indicator">
              <el-icon v-if="inputStates[index] === 'correct'" class="correct-icon">
                <Check />
              </el-icon>
              <el-icon v-if="inputStates[index] === 'incorrect'" class="incorrect-icon">
                <Close />
              </el-icon>
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
          <span>正确: {{ correctCount }}</span>
          <span>错误: {{ incorrectCount }}</span>
          <span>完成度: {{ Math.round((correctCount / words.length) * 100) }}%</span>
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
      <p>正在加载词语...</p>
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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Close } from '@element-plus/icons-vue'
import { practiceAPI } from '../utils/api'

export default {
  name: 'WordPractice',
  components: {
    ArrowLeft,
    ArrowRight,
    Check,
    Close
  },
  setup() {
    const router = useRouter()
    const words = ref([])
    const currentPage = ref(1)
    const totalPages = ref(1)
    const userInputs = reactive({})
    const inputStates = reactive({})
    const showPinyinIndex = ref(-1)
    const correctAudio = ref(null)
    const incorrectAudio = ref(null)
    
    // 创建音频数据URL
    const correctSound = ref('')
    const incorrectSound = ref('')
    
    const correctCount = computed(() => {
      return Object.values(inputStates).filter(state => state === 'correct').length
    })
    
    const incorrectCount = computed(() => {
      return Object.values(inputStates).filter(state => state === 'incorrect').length
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
    
    const loadWords = async (page = 1) => {
      try {
        const response = await practiceAPI.getWords(page)
        words.value = response.data.words
        currentPage.value = response.data.page
        totalPages.value = response.data.total_pages
        
        // 重置输入状态
        Object.keys(userInputs).forEach(key => delete userInputs[key])
        Object.keys(inputStates).forEach(key => delete inputStates[key])
        showPinyinIndex.value = -1
        
        // 初始化输入框
        words.value.forEach((_, index) => {
          userInputs[index] = ''
          inputStates[index] = ''
        })
      } catch (error) {
        console.error('加载词语失败:', error)
        ElMessage.error('加载词语失败')
      }
    }
    
    const loadProgress = async () => {
      try {
        const response = await practiceAPI.getProgress('word')
        const savedPage = response.data.page
        if (savedPage > 1) {
          currentPage.value = savedPage
          await loadWords(savedPage)
        } else {
          await loadWords(1)
        }
      } catch (error) {
        console.error('加载进度失败:', error)
        await loadWords(1)
      }
    }
    
    const checkInput = (index) => {
      const userInput = userInputs[index].trim()
      const correctWord = words.value[index].word
      
      if (userInput === '') {
        inputStates[index] = ''
        return
      }
      
      // 直接对比汉字
      if (userInput === correctWord) {
        inputStates[index] = 'correct'
        playCorrectSound()
      } else {
        inputStates[index] = 'incorrect'
        playIncorrectSound()
      }
    }
    
    const showPinyin = (index) => {
      showPinyinIndex.value = showPinyinIndex.value === index ? -1 : index
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
        await loadWords(currentPage.value - 1)
      }
    }
    
    const nextPage = async () => {
      if (currentPage.value < totalPages.value) {
        await loadWords(currentPage.value + 1)
      }
    }
    
    const saveProgress = async () => {
      try {
        await practiceAPI.saveProgress('word', currentPage.value)
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
      words,
      currentPage,
      totalPages,
      userInputs,
      inputStates,
      showPinyinIndex,
      correctCount,
      incorrectCount,
      correctAudio,
      incorrectAudio,
      correctSound,
      incorrectSound,
      checkInput,
      showPinyin,
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
  max-width: 1200px;
  margin: 0 auto;
}

.instruction-banner {
  margin-bottom: 30px;
}

.instruction-banner :deep(.el-alert) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.word-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.word-display {
  text-align: center;
  margin-bottom: 15px;
  cursor: pointer;
  padding: 15px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.word-display:hover {
  background: rgba(102, 126, 234, 0.1);
}

.word-display.show-pinyin {
  background: rgba(102, 126, 234, 0.1);
}

.word-text {
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.pinyin-text {
  font-size: 18px;
  color: #667eea;
  font-weight: 500;
}

.input-section {
  position: relative;
}

.status-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
}

.correct-icon {
  color: #67c23a;
}

.incorrect-icon {
  color: #f56c6c;
}

:deep(.el-input.correct .el-input__wrapper) {
  border-color: #67c23a;
  box-shadow: 0 0 0 1px #67c23a;
}

:deep(.el-input.incorrect .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px #f56c6c;
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

:deep(.el-input__wrapper) {
  border-radius: 10px;
}
</style>
