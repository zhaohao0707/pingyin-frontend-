<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>拼音学习系统</h1>
        <p>欢迎使用拼音学习平台</p>
      </div>
      
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="loginForm" 
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            登录
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            size="large" 
            @click="handleRegister"
            class="register-btn"
          >
            注册新用户
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../utils/api'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginForm = ref(null)
    const loading = ref(false)
    
    const form = reactive({
      username: '',
      password: ''
    })
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        const valid = await loginForm.value.validate()
        if (!valid) return
        
        loading.value = true
        const response = await authAPI.login(form.username, form.password)
        
        const { token, user_id, username, is_admin } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user_id', user_id)
        localStorage.setItem('username', username)
        localStorage.setItem('is_admin', is_admin)
        
        ElMessage.success('登录成功')
        router.push('/menu')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handleRegister = async () => {
      try {
        const valid = await loginForm.value.validate()
        if (!valid) return
        
        loading.value = true
        await authAPI.register(form.username, form.password)
        
        ElMessage.success('注册成功，请登录')
        form.password = ''
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handleSubmit = () => {
      handleLogin()
    }
    
    return {
      form,
      rules,
      loading,
      loginForm,
      handleLogin,
      handleRegister,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.login-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.login-btn, .register-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 10px;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-bottom: 10px;
}

.register-btn {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.register-btn:hover {
  background: #667eea;
  color: white;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  height: 45px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
