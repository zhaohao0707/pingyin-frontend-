<template>
  <div class="menu-container">
    <div class="header">
      <h1>拼音学习系统</h1>
      <div class="user-info">
        <span>欢迎，{{ username }}</span>
        <el-button @click="logout" type="text" class="logout-btn">
          退出登录
        </el-button>
      </div>
    </div>
    
    <div class="menu-content">
      <div class="welcome-text">
        <h2>选择学习模式</h2>
        <p>请选择您想要练习的内容类型</p>
      </div>
      
      <div class="menu-options">
        <div class="option-card" @click="goToWordPractice">
          <div class="card-icon">
            <el-icon size="60">
              <Document />
            </el-icon>
          </div>
          <h3>词语练习</h3>
          <p>练习常用词语的拼音</p>
          <div class="progress-info" v-if="wordProgress > 1">
            <span>上次学习到第 {{ wordProgress }} 页</span>
          </div>
        </div>
        
        <div class="option-card" @click="goToArticlePractice">
          <div class="card-icon">
            <el-icon size="60">
              <Reading />
            </el-icon>
          </div>
          <h3>文章练习</h3>
          <p>练习文章段落的拼音</p>
          <div class="progress-info" v-if="articleProgress > 1">
            <span>上次学习到第 {{ articleProgress }} 页</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Reading } from '@element-plus/icons-vue'
import { practiceAPI } from '../utils/api'

export default {
  name: 'Menu',
  components: {
    Document,
    Reading
  },
  setup() {
    const router = useRouter()
    const username = ref(localStorage.getItem('username') || '用户')
    const wordProgress = ref(1)
    const articleProgress = ref(1)
    
    const loadProgress = async () => {
      try {
        const [wordRes, articleRes] = await Promise.all([
          practiceAPI.getProgress('word'),
          practiceAPI.getProgress('article')
        ])
        
        wordProgress.value = wordRes.data.page
        articleProgress.value = articleRes.data.page
      } catch (error) {
        console.error('加载进度失败:', error)
      }
    }
    
    const goToWordPractice = () => {
      router.push('/word-practice')
    }
    
    const goToArticlePractice = () => {
      router.push('/article-practice')
    }
    
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('username')
      ElMessage.success('已退出登录')
      router.push('/login')
    }
    
    onMounted(() => {
      loadProgress()
    })
    
    return {
      username,
      wordProgress,
      articleProgress,
      goToWordPractice,
      goToArticlePractice,
      logout
    }
  }
}
</script>

<style scoped>
.menu-container {
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

.header h1 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #7f8c8d;
}

.logout-btn {
  color: #e74c3c !important;
  padding: 0 !important;
}

.menu-content {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-text {
  text-align: center;
  margin-bottom: 50px;
  color: white;
}

.welcome-text h2 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-text p {
  font-size: 16px;
  opacity: 0.9;
}

.menu-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  padding: 0 20px;
}

.option-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.option-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.card-icon {
  color: #667eea;
  margin-bottom: 20px;
}

.option-card h3 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
}

.option-card p {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 15px;
}

.progress-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-block;
}
</style>
