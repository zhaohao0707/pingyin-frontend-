<template>
  <div class="management-overlay">
    <div class="management-panel">
      <div class="panel-header">
        <h2>词库管理</h2>
        <div class="header-actions">
          <el-button @click="showAddDialog = true" type="primary">
            <el-icon><Plus /></el-icon>
            添加词语
          </el-button>
          <el-button @click="$emit('close')" type="text" size="large">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="table-container">
          <el-table :data="words" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="word" label="词语" />
            <el-table-column prop="pinyin" label="拼音" />
            <el-table-column label="操作" width="160">
              <template #default="scope">
                <el-button @click="editWord(scope.row)" type="primary" size="small">
                  编辑
                </el-button>
                <el-button @click="deleteWord(scope.row)" type="danger" size="small">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @current-change="loadWords"
              @size-change="loadWords"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑词语对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingWord ? '编辑词语' : '添加词语'"
      width="400px"
    >
      <el-form :model="wordForm" label-width="80px">
        <el-form-item label="词语" required>
          <el-input v-model="wordForm.word" placeholder="请输入词语" />
        </el-form-item>
        <el-form-item label="拼音" required>
          <el-input v-model="wordForm.pinyin" placeholder="请输入拼音" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveWord" :loading="saving">
            {{ editingWord ? '更新' : '添加' }}
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
  name: 'WordManagement',
  components: {
    Close,
    Plus
  },
  emits: ['close', 'word-changed'],
  setup(props, { emit }) {
    const words = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(50)
    const total = ref(0)
    const showAddDialog = ref(false)
    const editingWord = ref(null)
    
    const wordForm = reactive({
      word: '',
      pinyin: ''
    })
    
    const loadWords = async () => {
      loading.value = true
      try {
        const response = await adminAPI.getAllWords(currentPage.value)
        words.value = response.data.words
        total.value = response.data.total
      } catch (error) {
        console.error('加载词语失败:', error)
        ElMessage.error('加载词语失败')
      } finally {
        loading.value = false
      }
    }
    
    const editWord = (word) => {
      editingWord.value = word
      wordForm.word = word.word
      wordForm.pinyin = word.pinyin
      showAddDialog.value = true
    }
    
    const saveWord = async () => {
      if (!wordForm.word.trim() || !wordForm.pinyin.trim()) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      saving.value = true
      try {
        if (editingWord.value) {
          await adminAPI.updateWord(editingWord.value.id, wordForm.word, wordForm.pinyin)
          ElMessage.success('词语更新成功')
        } else {
          await adminAPI.addWord(wordForm.word, wordForm.pinyin)
          ElMessage.success('词语添加成功')
        }
        
        showAddDialog.value = false
        resetForm()
        await loadWords()
        emit('word-changed')
      } catch (error) {
        console.error('保存词语失败:', error)
        ElMessage.error('保存词语失败')
      } finally {
        saving.value = false
      }
    }
    
    const deleteWord = async (word) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除词语 "${word.word}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await adminAPI.deleteWord(word.id)
        ElMessage.success('词语删除成功')
        await loadWords()
        emit('word-changed')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除词语失败:', error)
          ElMessage.error('删除词语失败')
        }
      }
    }
    
    const resetForm = () => {
      editingWord.value = null
      wordForm.word = ''
      wordForm.pinyin = ''
    }
    
    onMounted(() => {
      loadWords()
    })
    
    return {
      words,
      loading,
      saving,
      currentPage,
      pageSize,
      total,
      showAddDialog,
      editingWord,
      wordForm,
      loadWords,
      editWord,
      saveWord,
      deleteWord,
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
  width: 90%;
  max-width: 900px;
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
</style>
