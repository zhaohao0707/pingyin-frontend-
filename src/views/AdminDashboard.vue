<template>
  <div class="admin-container">
    <div class="header">
      <h1>管理员后台</h1>
      <div class="user-info">
        <span>管理员：{{ username }}</span>
        <el-button @click="goBack" type="primary" plain>
          返回主菜单
        </el-button>
        <el-button @click="logout" type="text" class="logout-btn">
          退出登录
        </el-button>
      </div>
    </div>
    
    <div class="admin-content">
      <div class="welcome-text">
        <h2>系统管理面板</h2>
        <p>管理用户、词库和文章内容</p>
      </div>
      
      <div class="admin-options">
        <div class="option-card" @click="currentView = 'users'">
          <div class="card-icon">
            <el-icon size="60">
              <User />
            </el-icon>
          </div>
          <h3>用户管理</h3>
          <p>查看和管理注册用户</p>
          <div class="stats-info">
            <span>{{ userCount }} 个用户</span>
          </div>
        </div>
        
        <div class="option-card" @click="currentView = 'words'">
          <div class="card-icon">
            <el-icon size="60">
              <Document />
            </el-icon>
          </div>
          <h3>词库管理</h3>
          <p>添加、编辑和删除词语</p>
          <div class="stats-info">
            <span>{{ wordCount }} 个词语</span>
          </div>
        </div>
        
        <div class="option-card" @click="currentView = 'articles'">
          <div class="card-icon">
            <el-icon size="60">
              <Reading />
            </el-icon>
          </div>
          <h3>文章管理</h3>
          <p>添加、编辑和删除文章</p>
          <div class="stats-info">
            <span>{{ articleCount }} 篇文章</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 用户管理视图 -->
    <UserManagement 
      v-if="currentView === 'users'" 
      @close="currentView = ''"
      @user-deleted="loadStats"
    />
    
    <!-- 词库管理视图 -->
    <WordManagement 
      v-if="currentView === 'words'" 
      @close="currentView = ''"
      @word-changed="loadStats"
    />
    
    <!-- 文章管理视图 -->
    <ArticleManagement 
      v-if="currentView === 'articles'" 
      @close="currentView = ''"
      @article-changed="loadStats"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Document, Reading } from '@element-plus/icons-vue'
import { adminAPI } from '../utils/api'
import UserManagement from '../components/UserManagement.vue'
import WordManagement from '../components/WordManagement.vue'
import ArticleManagement from '../components/ArticleManagement.vue'

export default {
  name: 'AdminDashboard',
  components: {
    User,
    Document,
    Reading,
    UserManagement,
    WordManagement,
    ArticleManagement
  },
  setup() {
    const router = useRouter()
    const username = ref(localStorage.getItem('username') || '管理员')
    const currentView = ref('')
    const userCount = ref(0)
    const wordCount = ref(0)
    const articleCount = ref(0)
    
    const loadStats = async () => {
      try {
        const [usersRes, wordsRes, articlesRes] = await Promise.all([
          adminAPI.getUsers(1),
          adminAPI.getAllWords(1),
          adminAPI.getAllArticles(1)
        ])
        
        userCount.value = usersRes.data.total
        wordCount.value = wordsRes.data.total
        articleCount.value = articlesRes.data.total
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }
    
    const goBack = () => {
      router.push('/menu')
    }
    
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('username')
      localStorage.removeItem('is_admin')
      ElMessage.success('已退出登录')
      router.push('/login')
    }
    
    onMounted(() => {
      loadStats()
    })
    
    return {
      username,
      currentView,
      userCount,
      wordCount,
      articleCount,
      loadStats,
      goBack,
      logout
    }
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.admin-content {
  max-width: 1000px;
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

.admin-options {
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

.stats-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-block;
  font-weight: 500;
}
</style>
