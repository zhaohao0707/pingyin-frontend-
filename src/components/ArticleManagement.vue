<template>
  <div class="management-overlay">
    <div class="management-panel">
      <div class="panel-header">
        <h2>文章管理</h2>
        <div class="header-actions">
          <el-button @click="showAddDialog = true" type="primary">
            <el-icon><Plus /></el-icon>
            添加文章
          </el-button>
          <el-button @click="$emit('close')" type="text" size="large">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="table-container">
          <el-table :data="articles" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" width="200" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="操作" width="160">
              <template #default="scope">
                <el-button @click="editArticle(scope.row)" type="primary" size="small">
                  编辑
                </el-button>
                <el-button @click="deleteArticle(scope.row)" type="danger" size="small">
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
              @current-change="loadArticles"
              @size-change="loadArticles"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑文章对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingArticle ? '编辑文章' : '添加文章'"
      width="600px"
    >
      <el-form :model="articleForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="articleForm.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input 
            v-model="articleForm.content" 
            type="textarea" 
            :rows="6"
            placeholder="请输入文章内容" 
          />
        </el-form-item>
        <el-form-item label="拼音" required>
          <el-input 
            v-model="articleForm.pinyin" 
            type="textarea" 
            :rows="4"
            placeholder="请输入对应的拼音" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveArticle" :loading="saving">
            {{ editingArticle ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Plus } from '@element-plus/icons-vue'
import { adminAPI } from '../utils/api'

export default {
  name: 'ArticleManagement',
  components: {
    Close,
    Plus
  },
  emits: ['close', 'article-changed'],
  setup(props, { emit }) {
    const articles = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    const showAddDialog = ref(false)
    const editingArticle = ref(null)
    
    const articleForm = reactive({
      title: '',
      content: '',
      pinyin: ''
    })
    
    const loadArticles = async () => {
      loading.value = true
      try {
        const response = await adminAPI.getAllArticles(currentPage.value)
        articles.value = response.data.articles
        total.value = response.data.total
      } catch (error) {
        console.error('加载文章失败:', error)
        ElMessage.error('加载文章失败')
      } finally {
        loading.value = false
      }
    }
    
    const editArticle = (article) => {
      editingArticle.value = article
      articleForm.title = article.title
      articleForm.content = article.content
      articleForm.pinyin = article.pinyin
      showAddDialog.value = true
    }
    
    const saveArticle = async () => {
      if (!articleForm.title.trim() || !articleForm.content.trim() || !articleForm.pinyin.trim()) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      saving.value = true
      try {
        if (editingArticle.value) {
          await adminAPI.updateArticle(
            editingArticle.value.id, 
            articleForm.title, 
            articleForm.content, 
            articleForm.pinyin
          )
          ElMessage.success('文章更新成功')
        } else {
          await adminAPI.addArticle(articleForm.title, articleForm.content, articleForm.pinyin)
          ElMessage.success('文章添加成功')
        }
        
        showAddDialog.value = false
        resetForm()
        await loadArticles()
        emit('article-changed')
      } catch (error) {
        console.error('保存文章失败:', error)
        ElMessage.error('保存文章失败')
      } finally {
        saving.value = false
      }
    }
    
    const deleteArticle = async (article) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除文章 "${article.title}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await adminAPI.deleteArticle(article.id)
        ElMessage.success('文章删除成功')
        await loadArticles()
        emit('article-changed')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除文章失败:', error)
          ElMessage.error('删除文章失败')
        }
      }
    }
    
    const resetForm = () => {
      editingArticle.value = null
      articleForm.title = ''
      articleForm.content = ''
      articleForm.pinyin = ''
    }
    
    onMounted(() => {
      loadArticles()
    })
    
    return {
      articles,
      loading,
      saving,
      currentPage,
      pageSize,
      total,
      showAddDialog,
      editingArticle,
      articleForm,
      loadArticles,
      editArticle,
      saveArticle,
      deleteArticle,
      resetForm
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
  width: 95%;
  max-width: 1200px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog) {
  border-radius: 15px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
