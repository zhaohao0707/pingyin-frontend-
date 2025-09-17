<template>
  <div class="management-overlay">
    <div class="management-panel">
      <div class="panel-header">
        <h2>用户管理</h2>
        <el-button @click="$emit('close')" type="text" size="large">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="panel-content">
        <div class="table-container">
          <el-table :data="users" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="is_admin" label="管理员" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.is_admin ? 'success' : 'info'">
                  {{ scope.row.is_admin ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button 
                  @click="deleteUser(scope.row)" 
                  type="danger" 
                  size="small"
                  :disabled="scope.row.is_admin"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @current-change="loadUsers"
              @size-change="loadUsers"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { adminAPI } from '../utils/api'

export default {
  name: 'UserManagement',
  components: {
    Close
  },
  emits: ['close', 'user-deleted'],
  setup(props, { emit }) {
    const users = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    
    const loadUsers = async () => {
      loading.value = true
      try {
        const response = await adminAPI.getUsers(currentPage.value)
        users.value = response.data.users
        total.value = response.data.total
      } catch (error) {
        console.error('加载用户失败:', error)
        ElMessage.error('加载用户失败')
      } finally {
        loading.value = false
      }
    }
    
    const deleteUser = async (user) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await adminAPI.deleteUser(user.id)
        ElMessage.success('用户删除成功')
        await loadUsers()
        emit('user-deleted')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error)
          ElMessage.error('删除用户失败')
        }
      }
    }
    
    onMounted(() => {
      loadUsers()
    })
    
    return {
      users,
      loading,
      currentPage,
      pageSize,
      total,
      loadUsers,
      deleteUser
    }
  }
}
</script>

<style scoped>
.management-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.management-panel {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.panel-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.panel-content {
  padding: 20px 30px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-table th) {
  background: #f8f9fa;
}

:deep(.el-button--text) {
  padding: 0;
}
</style>
