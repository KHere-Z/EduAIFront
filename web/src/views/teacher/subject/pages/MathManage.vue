<template>
  <div class="page-container">
    <div class="page-header"><div><h2>📐 数学学科管理</h2><p>知识点 · 题库 · 配图 · 老师解析</p></div><el-button type="success" @click="$router.push('/teacher/subject/math/exam-builder')">📝 出卷</el-button></div>
    <el-tabs v-model="tab">
      <el-tab-pane label="📖 知识点管理" name="kp">
        <div class="mb-lg filter-bar">
          <el-button type="primary" @click="openKpForm()"><el-icon><Plus /></el-icon>新增知识点</el-button>
          <el-select v-model="kpGradeFilter" placeholder="年级筛选" clearable style="width:160px"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select>
          <el-button v-if="kpSelection.length" type="danger" plain @click="batchDelKps">🗑 批量删除({{kpSelection.length}})</el-button>
        </div>
        <el-table :data="pagedKps" stripe size="small" @selection-change="kpSelection=$event">
          <el-table-column type="selection" width="40" :selectable="isOwnKp"/>
          <el-table-column prop="name" label="知识点" min-width="160"/><el-table-column prop="gradeLevel" label="年级·学期" width="130" align="center"/>
          <el-table-column label="资源" width="90" align="center"><template #default="{row}"><el-button size="small" type="success" plain @click="$router.push('/teacher/subject/math/kp-resources/'+row.id)">{{ isOwnKp(row) ? '📎 管理' : '👀 查看' }}{{ getKpResCount(row.id) ? ' ('+getKpResCount(row.id)+')' : '' }}</el-button></template></el-table-column>
          <el-table-column label="操作" width="120" align="center"><template #default="{row}"><template v-if="isOwnKp(row)"><el-button size="small" text type="primary" @click="openKpForm(row)">编辑</el-button><el-button size="small" text type="danger" @click="delKp(row)">删除</el-button></template><el-tag v-else size="small" type="info" effect="plain">同事·只读</el-tag></template></el-table-column>
        </el-table>
        <div class="mt-lg" style="text-align:right"><el-pagination v-model:current-page="kpPage" :page-size="15" :total="filteredKps.length" layout="total, prev, pager, next" background/></div>
      </el-tab-pane>

      <el-tab-pane label="📋 题库管理" name="questions">
        <div class="mb-lg filter-bar">
          <el-input v-model="qSearch" placeholder="搜索题目..." :prefix-icon="Search" style="width:180px" clearable/>
          <el-select v-model="qGradeFilter" placeholder="年级·学期" clearable style="width:160px" @change="qKpFilter=null"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select>
          <el-select v-model="qKpFilter" placeholder="知识点" clearable style="width:140px" :disabled="!qGradeFilter"><el-option v-for="k in filteredKpsForGrade" :key="k.id" :label="k.name" :value="k.id"/></el-select>
          <el-select v-model="qTypeFilter" placeholder="来源" clearable style="width:80px"><el-option label="错题" value="WRONG"/><el-option label="新题" value="NEW"/></el-select>
          <el-select v-model="qQuestionType" placeholder="题型" clearable style="width:90px"><el-option label="选择题" value="选择题"/><el-option label="填空题" value="填空题"/><el-option label="计算题" value="计算题"/><el-option label="解答题" value="解答题"/></el-select>
          <el-select v-model="qStudentFilter" placeholder="学生(仅错题)" clearable style="width:130px" v-if="qTypeFilter==='WRONG'"><el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/></el-select>
          <el-select v-model="qSharedFilter" placeholder="共享" clearable style="width:90px" v-if="qTypeFilter==='NEW'"><el-option label="共享" :value="true"/><el-option label="私有" :value="false"/></el-select>
          <el-date-picker v-model="qDateFilter" type="date" placeholder="上传日期" clearable style="width:140px" value-format="YYYY-MM-DD"/>
          <el-button v-if="qSelection.length" type="danger" plain @click="batchDelQuestions">🗑 批量删除({{qSelection.length}})</el-button>
        </div>
        <el-table :data="pagedQuestions" stripe size="small" @selection-change="qSelection=$event">
          <el-table-column type="selection" width="40" :selectable="canManageQ"/>
          <el-table-column label="题目" min-width="180" show-overflow-tooltip><template #default="{row}"><span v-html="row._titleHtml || row.title"></span></template></el-table-column>
          <el-table-column label="知识点" width="150"><template #default="{row}"><el-tag v-if="!row.kpNames?.length" size="small" type="warning" effect="plain">待标识</el-tag><el-tag v-for="kp in (row.kpNames||[])" :key="kp" size="small" effect="plain" style="margin:1px">{{ kp }}</el-tag></template></el-table-column>
          <el-table-column label="配图" width="60" align="center"><template #default="{row}"><el-tag :type="row.diagramImageUrl?'success':'info'" size="small">{{ row.diagramImageUrl?'有':'无' }}</el-tag></template></el-table-column>
          <el-table-column label="老师解析" width="75" align="center"><template #default="{row}"><el-tag :type="(row.teacherAnalysis||row.teacherAnalysisImage)?'success':'info'" size="small">{{ (row.teacherAnalysis||row.teacherAnalysisImage)?'有':'无' }}</el-tag></template></el-table-column>
          <el-table-column label="题型" width="60" align="center"><template #default="{row}"><span style="font-size:12px;color:#666">{{ row.questionType||'-' }}</span></template></el-table-column>
          <el-table-column label="来源" width="60" align="center"><template #default="{row}"><el-tag :type="row.type==='NEW'?'success':'danger'" size="small">{{ row.type==='NEW'?'新题':'错题' }}</el-tag></template></el-table-column>
          <el-table-column label="难度" width="65" align="center"><template #default="{row}"><el-tag :type="row.difficulty==='EASY'?'success':row.difficulty==='MEDIUM'?'warning':'danger'" size="small">{{ row.difficulty==='EASY'?'简单':row.difficulty==='MEDIUM'?'中等':'困难' }}</el-tag></template></el-table-column>
          <el-table-column label="浏览权限" width="85" align="center"><template #default="{row}"><el-tag :type="row.shared?'success':'info'" size="small">{{ row.shared ? '共享' : '私有' }}</el-tag></template></el-table-column>
          <el-table-column label="日期" width="90" align="center" prop="createdAt"/>
          <el-table-column label="操作" width="130" align="center"><template #default="{row}"><el-button size="small" text type="primary" @click="viewQuestion(row)">详情</el-button><el-button v-if="canManageQ(row)" size="small" text type="danger" @click="delQuestion(row)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="mt-lg" style="text-align:right"><el-pagination v-model:current-page="qPage" :page-size="15" :total="filteredQuestions.length" layout="total, prev, pager, next" background/></div>
      </el-tab-pane>
      <el-tab-pane label="📤 上传题目" name="upload">
        <div style="max-width:620px">
          <div style="margin-bottom:16px"><el-radio-group v-model="uploadMode"><el-radio-button value="single">单题上传</el-radio-button><el-radio-button value="batch">批量上传</el-radio-button></el-radio-group></div>
          <el-form v-if="uploadMode==='single'" label-width="80px">
            <el-form-item label="题目类型">
          <el-radio-group v-model="upType"><el-radio value="NEW">新题</el-radio><el-radio value="WRONG">错题</el-radio></el-radio-group>
          <el-select v-model="upQuestionType" placeholder="题型" size="small" style="width:100px;margin-left:12px"><el-option label="选择题" value="选择题"/><el-option label="填空题" value="填空题"/><el-option label="计算题" value="计算题"/><el-option label="解答题" value="解答题"/></el-select>
          <span style="margin-left:12px;font-size:12px;color:#666">共享 <el-switch v-model="upShared" size="small" style="margin-left:4px"/></span>
        </el-form-item>
            <el-form-item label="题目内容">
              <el-input v-model="upText" type="textarea" :rows="4" placeholder="粘贴题目文字或图片（Ctrl+V）" @paste="onUpPaste"/>
              <div v-if="upImages.length" class="up-imgs">
                <div v-for="(img,i) in upImages" :key="i" class="up-img-item"><img :src="img.url"/><span class="up-img-del" @click="upImages.splice(i,1)">✕</span></div>
              </div>
              <el-button size="small" type="primary" style="margin-top:6px" @click="doUploadOCR" :loading="upOcrLoading" :disabled="!upText.trim()&&!upImages.length">🔍 确认并分析</el-button>
            </el-form-item>
            <!-- OCR 预览 -->
            <template v-if="upPreviewShow">
              <el-form-item label="题目编辑"><el-input v-model="upRawOcr" type="textarea" :rows="6" placeholder="OCR识别结果，可修改（Ctrl+V粘贴图片）" @paste="onContentPaste"/></el-form-item>
              <el-form-item label="题目预览"><div class="up-preview-box" v-html="upPreviewHtml || '暂无预览'"></div></el-form-item>
              <el-form-item label="难度"><el-select v-model="upDifficulty" style="width:100%"><el-option label="简单" value="EASY"/><el-option label="中等" value="MEDIUM"/><el-option label="困难" value="HARD"/></el-select></el-form-item>
              <el-form-item label="知识点"><el-select v-model="upKpIds" multiple placeholder="选择" style="width:100%"><el-option v-for="k in kps" :key="k.id" :label="k.name" :value="k.id"/></el-select></el-form-item>
              <el-form-item label="题目配图">
              <el-input v-model="upDiagramText" type="textarea" :rows="2" placeholder="直接粘贴图片（Ctrl+V）或点击上传" @paste="onUpDiagramPaste"/>
              <div style="margin-top:4px"><el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onUpDiagram"><el-button size="small">📁 上传图片</el-button></el-upload><el-button size="small" style="margin-left:8px" @click="openCropDiagram">✂️ 从上传图截图</el-button></div>
              <img v-if="upDiagramUrl" :src="upDiagramUrl" style="max-width:200px;max-height:120px;border-radius:6px;margin-top:6px;display:block"/><el-button v-if="upDiagramUrl" size="small" type="danger" text @click="upDiagramUrl=''">删除</el-button>
            </el-form-item>
            </template>
            <el-form-item label="上传解析"><el-input v-model="upSolRaw" type="textarea" :rows="5" placeholder="直接输入解析文字，或粘贴图片（Ctrl+V）" @paste="onUpSolPaste"/><div v-if="upSolImages.length" class="up-imgs"><div v-for="(img,i) in upSolImages" :key="i" class="up-img-item"><img :src="img.url"/><span class="up-img-del" @click="upSolImages.splice(i,1)">✕</span></div></div><div style="margin-top:4px"><el-button size="small" type="primary" @click="doSolOCR" :loading="upSolLoading" :disabled="!upSolImages.length">🔍 OCR解析</el-button><el-button size="small" @click="doSolDirect" :disabled="!(upSolText.value||'').trim()&&!upSolImages.length">📋 直接上传</el-button></div></el-form-item>
            <el-form-item label="解析预览" v-if="upSolPreview"><div class="up-preview-box" v-html="upSolPreview"></div></el-form-item>
            <el-form-item label=""><el-button type="primary" @click="submitUpload">✅ 提交</el-button><el-button @click="resetUp">重置</el-button></el-form-item>
          </el-form>
          <div v-else class="batch-placeholder"><span style="font-size:40px">📤</span><p style="color:#666;margin-top:12px">支持 PDF / 图片批量识别题目、框选配图、批量入库</p><el-button type="primary" style="margin-top:16px" @click="$router.push('/teacher/subject/math/batch-upload')">进入批量上传</el-button></div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="📝 试卷管理" name="exams">
        <div class="mb-lg filter-bar">
          <el-select v-model="examFilterType" placeholder="考试类型" clearable style="width:100px"><el-option v-for="t in examTypes" :key="t" :label="t" :value="t"/></el-select>
          <el-select v-model="examFilterStudent" placeholder="学生" clearable style="width:130px"><el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/></el-select>
        </div>
        <el-table :data="filteredExamPapers" stripe size="small">
          <el-table-column prop="examType" label="类型" width="80"/>
          <el-table-column label="学生" width="80"><template #default="{row}"><span>{{ row.studentName||(studentList.find(s=>s.studentId===row.studentId)?.studentName)||'未知' }}</span></template></el-table-column>
          <el-table-column label="学科" width="70"><template #default="{row}"><span>{{ subjMap[row.subject]||row.subject }}</span></template></el-table-column>
          <el-table-column label="得分" width="60"><template #default="{row}"><span>{{ row.score||'-' }}</span></template></el-table-column>
          <el-table-column label="日期" width="100" prop="createdAt"/>
          <el-table-column label="操作" width="120"><template #default="{row}"><el-button size="small" text type="primary" @click="viewExam(row)">查看</el-button><el-button size="small" text type="danger" @click="delExam(row)">删除</el-button></template></el-table-column>
        </el-table>

        <!-- 成绩折线图 -->
        <div class="score-chart" v-if="chartData.length > 1">
          <h4 style="font-size:14px;font-weight:700;color:#333;margin:16px 0 8px">📈 成绩趋势</h4>
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="sc-svg">
            <!-- 网格线 -->
            <line v-for="i in 5" :key="'g'+i" :x1="40" :y1="20+(i-1)*(chartH-60)/4" :x2="chartW-10" :y2="20+(i-1)*(chartH-60)/4" stroke="#eee" stroke-width="0.5"/>
            <!-- Y轴标签 -->
            <text v-for="i in 5" :key="'y'+i" :x="34" :y="24+(i-1)*(chartH-60)/4" text-anchor="end" font-size="10" fill="#999">{{ Math.round(yMax-(i-1)*yStep) }}</text>
            <!-- X轴标签 -->
            <text v-for="(d,i) in chartData" :key="'x'+i" :x="xPos(i)" :y="chartH-4" text-anchor="middle" font-size="9" fill="#999">{{ d.label }}</text>
            <!-- 折线 -->
            <polyline :points="linePoints" fill="none" stroke="#6366F1" stroke-width="2" stroke-linejoin="round"/>
            <!-- 圆点 -->
            <circle v-for="(d,i) in chartData" :key="'c'+i" :cx="xPos(i)" :cy="yPos(d.score)" r="3.5" fill="#fff" stroke="#6366F1" stroke-width="2"/>
            <!-- 数值 -->
            <text v-for="(d,i) in chartData" :key="'t'+i" :x="xPos(i)" :y="yPos(d.score)-8" text-anchor="middle" font-size="10" fill="#6366F1" font-weight="600">{{ d.score }}</text>
          </svg>
        </div>
      </el-tab-pane>
      <el-tab-pane label="✏️ 作业管理" name="homework">
        <div class="mb-lg filter-bar">
          <el-button type="primary" @click="showHomeworkForm=true">+ 布置作业</el-button>
          <el-select v-model="hwStatusFilter" placeholder="状态" clearable style="width:100px">
            <el-option label="未提交" value="pending"/>
            <el-option label="已提交" value="submitted"/>
            <el-option label="已批改" value="corrected"/>
          </el-select>
          <el-select v-model="hwStudentFilter" placeholder="学生" clearable style="width:130px">
            <el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/>
          </el-select>
          <el-date-picker v-model="hwDateFilter" type="date" placeholder="日期" clearable style="width:140px" value-format="YYYY-MM-DD"/>
        </div>
        <el-table :data="filteredHwRows" stripe size="small">
          <el-table-column prop="title" label="作业标题" min-width="150"/>
          <el-table-column label="学生" width="90"><template #default="{row}"><span>{{ row.studentName||'未知' }}</span></template></el-table-column>
          <el-table-column label="状态" width="90" align="center"><template #default="{row}">
            <el-tag :type="row.status==='corrected'?'success':row.status==='submitted'?'warning':'info'" size="small">
              {{ row.status==='corrected'?'已批改':row.status==='submitted'?'已提交':'未提交' }}
            </el-tag>
          </template></el-table-column>
          <el-table-column label="日期" width="100" prop="createdAt"/>
          <el-table-column label="操作" width="150"><template #default="{row}">
            <el-button size="small" text type="primary" @click="openCorrect({id:row.homeworkId,title:row.title})">✏️ 批改</el-button>
            <el-button size="small" text type="danger" @click="delHomework({id:row.homeworkId})">删除</el-button>
          </template></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="📚 学习资源" name="resources">
        <ResourceUploadPanel subject="math" price-mode="tier" require-review />
      </el-tab-pane>
    </el-tabs>

    <!-- 布置作业 -->
    <el-dialog v-model="showHomeworkForm" title="布置作业" width="450px">
      <el-form label-width="80px"><el-form-item label="标题"><el-input v-model="hwForm.title"/></el-form-item><el-form-item label="描述"><el-input v-model="hwForm.desc" type="textarea" :rows="2"/></el-form-item><el-form-item label="学生"><el-select v-model="hwForm.studentIds" multiple placeholder="全部学生" style="width:100%"><el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/></el-select></el-form-item></el-form>
      <template #footer><el-button @click="showHomeworkForm=false">取消</el-button><el-button type="primary" @click="createHomework">确定</el-button></template>
    </el-dialog>
    <!-- 批改作业 -->
    <el-dialog v-model="showCorrect" :title="'批改 - '+(hwCurrent?.title||'')" width="750px">
      <!-- 学生切换 -->
      <div class="corr-tabs" v-if="hwSubList.length>1">
        <el-radio-group v-model="corrIdx" size="small">
          <el-radio-button v-for="(s,i) in hwSubList" :key="s.id" :value="i">{{ s.studentName||'学生'+i }}</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="corrSub" class="corr-body">
        <!-- ① 学生作业 -->
        <h4 class="corr-title">📤 学生作业</h4>
        <div class="hw-imgs">
          <div v-for="(img,i) in (corrSub.submittedImages||(corrSub.submittedImageUrl?[{url:corrSub.submittedImageUrl}]:[]))" :key="i" class="hw-img-item">
            <img :src="imgUrl(img.url||img)" @click="previewHw=imgUrl(img.url||img);showPreviewHw=true"/>
          </div>
          <el-empty v-if="!corrSub.submittedImageUrl&&!corrSub.submittedImages?.length" description="未提交" :image-size="60"/>
        </div>
        <!-- ② 批改图片 -->
        <h4 class="corr-title">✏️ 批改图片（Ctrl+V粘贴）</h4>
        <div class="hw-imgs" v-if="corrImgs.length">
          <div v-for="(img,i) in corrImgs" :key="i" class="hw-img-item">
            <img :src="img.url" @click="previewHw=img.url;showPreviewHw=true"/><span class="hw-img-del" @click.stop="corrImgs.splice(i,1)">✕</span>
          </div>
        </div>
        <div class="corr-paste" contenteditable @paste="onCorrPaste" @keydown.enter.prevent placeholder="点击此处粘贴批改图片（Ctrl+V）" style="border:2px dashed #ccc;border-radius:8px;padding:16px;text-align:center;color:#999;font-size:13px;cursor:text;min-height:40px">点击此处粘贴批改图片（Ctrl+V）</div>
        <div style="margin-top:6px">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onCorrUpload"><el-button size="small">📁 上传图片</el-button></el-upload>
        </div>
        <!-- ③ 答案解析 -->
        <h4 class="corr-title">📖 答案解析（Ctrl+V粘贴）</h4>
        <div class="hw-imgs" v-if="answerImgs.length">
          <div v-for="(img,i) in answerImgs" :key="i" class="hw-img-item">
            <img :src="img.url" @click="previewHw=img.url;showPreviewHw=true"/><span class="hw-img-del" @click.stop="answerImgs.splice(i,1)">✕</span>
          </div>
        </div>
        <div class="corr-paste" @paste="onAnswerPaste" style="border:2px dashed #ccc;border-radius:8px;padding:16px;text-align:center;color:#999;font-size:13px;cursor:text;min-height:40px">点击此处粘贴答案解析图片（Ctrl+V）</div>
        <div style="margin-top:6px">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" @change="onAnswerUpload"><el-button size="small">📁 上传文件</el-button></el-upload>
        </div>
      </div>
      <el-empty v-else description="暂无学生提交" :image-size="80"/>
      <template #footer>
        <el-button @click="showCorrect=false">关闭</el-button>
        <el-button type="primary" @click="saveCorrect">💾 保存批改</el-button>
      </template>
    </el-dialog>
    <!-- 试卷详情 -->
    <el-dialog v-model="showExamDetail" title="试卷详情" width="800px" destroy-on-close>
      <div v-if="examDetail" class="exam-detail">
        <div class="ed-row"><span class="ed-label">学生</span><span>{{ examDetail.studentName||'未知' }}</span></div>
        <div class="ed-row"><span class="ed-label">类型</span><span>{{ examDetail.examType||'-' }}</span></div>
        <div class="ed-row"><span class="ed-label">学科</span><span>{{ subjMap[examDetail.subject]||examDetail.subject }}</span></div>
        <div class="ed-row"><span class="ed-label">日期</span><span>{{ examDetail.createdAt?.slice(0,10) }}</span></div>

        <!-- 试卷原图 -->
        <h4 class="corr-title">📄 试卷原图</h4>
        <div class="hw-imgs" v-if="examImages.length">
          <div v-for="(img,i) in examImages" :key="i" class="hw-img-item">
            <img :src="imgUrl(img)" @click="previewHw=imgUrl(img);showPreviewHw=true"/>
          </div>
        </div>
        <el-empty v-else description="无原图" :image-size="60"/>

        <!-- 试卷分析 -->
        <h4 class="corr-title">🔍 试卷分析</h4>
        <el-input v-model="examAnalysisEdit" type="textarea" :rows="5" placeholder="AI 分析内容，可修改"/>

        <!-- 提分建议 -->
        <h4 class="corr-title">💡 提分建议</h4>
        <el-input v-model="examSuggestionsEdit" type="textarea" :rows="3" placeholder="可修改"/>

        <!-- 知识点 -->
        <h4 class="corr-title">📖 知识点清单</h4>
        <el-input v-model="examKpListEdit" placeholder="可修改"/>
      </div>
      <template #footer>
        <el-button @click="showExamDetail=false">关闭</el-button>
        <el-button type="primary" @click="saveExamDetail">💾 保存</el-button>
      </template>
    </el-dialog>
    <!-- 图片预览 -->
    <el-dialog v-model="showPreviewHw" title="图片预览" width="90%" :append-to-body="true" destroy-on-close>
      <img :src="previewHw" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px"/>
    </el-dialog>

    <el-dialog v-model="showKpForm" :title="editingKp?'编辑知识点':'新增知识点'" width="450px">
      <el-form :model="kpForm" label-width="80px"><el-form-item label="名称"><el-input v-model="kpForm.name"/></el-form-item><el-form-item label="年级"><el-select v-model="kpForm.gradeLevel" style="width:100%"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select></el-form-item></el-form>
      <template #footer><el-button @click="showKpForm=false">取消</el-button><el-button type="primary" @click="saveKp">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="showQDetail" title="题目详情" width="820px">
      <div v-if="currentQ" class="q-detail"><el-row :gutter="20"><el-col :span="12"><h4>📷 原上传图片</h4><div class="img-box"><img v-if="currentQ.originalImageUrl" :src="imgUrl(currentQ.originalImageUrl)" class="detail-img"/><el-empty v-else description="无原图" :image-size="80"/></div><h4 class="mt-lg">🖼 配图</h4><div class="img-box"><img v-if="currentQ.diagramImageUrl" :src="imgUrl(currentQ.diagramImageUrl)" class="detail-img"/><el-empty v-else description="无配图" :image-size="60"/></div><div class="mt-sm" v-if="qIsOwner"><el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="uploadDiagram"><el-button size="small">📁 上传配图</el-button></el-upload></div></el-col><el-col :span="12"><h4>📝 AI 识别</h4><div v-if="!qIsOwner" class="text-box" v-html="currentQ._titleHtml || currentQ.title"></div><template v-else><div v-if="!currentQ._titleEditing"><div class="text-box" v-html="currentQ._titleHtml || currentQ.title"></div><el-button size="small" text type="primary" @click="currentQ._titleEditing=true">✏️ 编辑</el-button></div><div v-else><el-input v-model="currentQ.title" type="textarea" :rows="4" placeholder="编辑题目内容..."/><div style="margin-top:4px"><el-button size="small" type="primary" @click="confirmTitleEdit">✅ 确认</el-button></div></div></template><h4 class="mt-lg">🏷 知识点</h4><el-select v-model="currentQ.kpIds" multiple placeholder="选择" style="width:100%" :disabled="!qIsOwner"><el-option v-for="k in kps" :key="k.id" :label="k.name" :value="k.id"/></el-select><h4 class="mt-lg">📊 难度</h4><el-select v-model="currentQ.difficulty" style="width:100%" :disabled="!qIsOwner"><el-option label="简单" value="EASY"/><el-option label="中等" value="MEDIUM"/><el-option label="困难" value="HARD"/></el-select><h4 class="mt-lg">👨‍🏫 老师解析</h4><div v-if="!qIsOwner" class="text-box" v-html="currentQ._taPreview || '暂无解析'"></div><template v-else><div v-if="!currentQ._taEditing" style="margin-bottom:8px"><div class="text-box" v-html="currentQ._taPreview || '暂无解析'"></div><el-button size="small" text type="primary" @click="currentQ._taEditing=true">✏️ 编辑</el-button></div><div v-else><el-input v-model="currentQ.teacherAnalysis" type="textarea" :rows="4" placeholder="输入文字解析...（可直接粘贴图片）" @paste="onTeacherPaste"/><div style="margin-top:4px"><el-button size="small" type="primary" @click="previewTeacherAnalysis(); currentQ._taEditing=false">✅ 确认</el-button></div></div></template><div v-if="qIsOwner && currentQ.source !== 'STUDENT'" style="margin-top:16px"><span style="font-size:14px;font-weight:600">🌐 共享</span><el-radio-group v-model="currentQ.shared" style="margin-left:8px"><el-radio :value="true">共享</el-radio><el-radio :value="false">私有</el-radio></el-radio-group></div><h4 class="mt-lg" v-if="currentQ.solution">📝 AI解答</h4><div class="text-box" v-if="currentQ.solution" v-html="currentQ._solutionHtml || currentQ.solution"></div><el-button v-if="qIsOwner" type="primary" size="small" class="mt-lg" @click="saveQDetail">保存修改</el-button></el-col></el-row></div>
    </el-dialog>

    <el-dialog v-model="showCrop" title="✂️ 截图配图" width="820px" :close-on-click-modal="false" destroy-on-close>
      <div style="text-align:center;overflow:auto">
        <div class="crop-wrap" ref="cropWrap">
          <img :src="cropSrc" ref="cropImgEl" class="crop-src-img" @load="initCrop" draggable="false"/>
          <div v-if="cropReady" class="crop-box" :style="cropBoxStyle" @pointerdown="startCropDrag('move', $event)">
            <span class="crop-handle ch-nw" @pointerdown.stop="startCropDrag('nw',$event)"></span>
            <span class="crop-handle ch-n" @pointerdown.stop="startCropDrag('n',$event)"></span>
            <span class="crop-handle ch-ne" @pointerdown.stop="startCropDrag('ne',$event)"></span>
            <span class="crop-handle ch-e" @pointerdown.stop="startCropDrag('e',$event)"></span>
            <span class="crop-handle ch-se" @pointerdown.stop="startCropDrag('se',$event)"></span>
            <span class="crop-handle ch-s" @pointerdown.stop="startCropDrag('s',$event)"></span>
            <span class="crop-handle ch-sw" @pointerdown.stop="startCropDrag('sw',$event)"></span>
            <span class="crop-handle ch-w" @pointerdown.stop="startCropDrag('w',$event)"></span>
          </div>
        </div>
      </div>
      <template #footer><el-button @click="showCrop=false">取消</el-button><el-button type="primary" @click="confirmCrop">✅ 提交</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Search, Plus, Camera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKnowledgePoints, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint, getKpResources } from '@/api/common/knowledge'
import http from '@/api/request'

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) {
    // 过滤 data:image/png;base64 这种无实际数据的残缺 URL
    return url.includes(',') ? url : ''
  }
  if (url.startsWith('http')) return url
  // 相对路径（/uploads/xxx 等）→ 由反代处理
  if (url.startsWith('/9j/') || url.startsWith('iVBOR')) return 'data:image/jpeg;base64,' + url
  if (url.startsWith('/')) return resolveStaticUrl(url)
  return url
}
import { getTeacherQuestions, updateTeacherQuestion, uploadTeacherQuestion, deleteTeacherQuestion } from '@/api/common/questions'
import { renderMarkdown } from '@/utils/markdown'
import { resolveStaticUrl } from '@/utils/url'
import { getTeacherMathStudents } from '@/api/common/admin'
import ResourceUploadPanel from '@/components/ResourceUploadPanel.vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const myUid = computed(() => String(auth.user?.uid ?? auth.user?.id ?? '').padStart(8, '0'))
function isOwnKp(row) {
  // 后端 KnowledgePointVO.teacherId 为 8 位零填充 uid（formatUid）；为空 = 存量历史共享，只读
  if (row.teacherId == null) return false
  return String(row.teacherId).padStart(8, '0') === myUid.value
}
function isOwnQ(q) {
  // QuestionVO.teacherId = users.id（数字 Long），与 auth.user.id 对齐；
  // 注意不是 uid（8 位零填充字符串）。用 String 比较，兼容 Long 序列化为数字/字符串两种形态
  if (!q || q.teacherId == null) return false
  return String(q.teacherId) === String(auth.user?.id ?? '')
}
function canManageQ(q) {
  // 学生来源的错题（source=STUDENT）：绑定老师可编辑/删除
  // /teacher/questions 已按绑定关系过滤，能出现在列表里的学生错题即已绑定
  if (q?.source === 'STUDENT') return true
  return isOwnQ(q)
}

const tab = ref('kp')

const grades = ['三年级·上学期','三年级·下学期','四年级·上学期','四年级·下学期','五年级·上学期','五年级·下学期','六年级·上学期','六年级·下学期','初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期','高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']
const showKpForm = ref(false); const editingKp = ref(null); const kpGradeFilter = ref(''); const kpPage = ref(1); const kpSelection = ref([])
const kpResCounts = reactive({})

async function loadKpResources() {
  if (!kps.value.length) return
  for (const kp of kps.value) {
    try { const r = await getKpResources(kp.id); kpResCounts[kp.id] = (r?.length||0) } catch { kpResCounts[kp.id] = 0 }
  }
}
function getKpResCount(kpId) { return kpResCounts[kpId] || 0 }

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}
const qSelection = ref([])
const kpForm = reactive({ name:'', gradeLevel:'', subject:'math' })
const kps = ref([])

async function loadKps() { try { const r = await getKnowledgePoints({ subject:'math', pageSize:200 }); kps.value = r.list||[] } catch {} }
async function loadQuestions() { try { const r = await getTeacherQuestions({ subject:'math', pageSize:200 }); questions.value = (r.list||[]).map(q => ({...q, kpNames:(q.knowledgePointNames||'').split(',').filter(Boolean), kpIds:(q.knowledgePointIds||'').split(',').filter(Boolean).map(Number), createdAt:q.createdAt?.slice(0,10)||'', diagramStatus:q.diagramImageUrl ? (q.diagramStatus||'AUTO') : 'NONE' })); for (const q of questions.value) { if (q.title) q._titleHtml = await renderMarkdown(q.title) } } catch {} }
const examTypes = ['周测','月考','期中','期末','模拟考']
const examPapers = ref([]); const examFilterType = ref(''); const examFilterStudent = ref(null)
const subjMap = {math:'数学',chinese:'语文',english:'英语',physics:'物理',chemistry:'化学',biology:'生物',history:'历史',politics:'政治',geography:'地理'}
const filteredExamPapers = computed(() => examPapers.value.filter(p => { if(examFilterType.value&&p.examType!==examFilterType.value)return false; if(examFilterStudent.value&&p.studentId!==examFilterStudent.value)return false; return true }))

// 成绩折线图
const chartData = computed(() => {
  return filteredExamPapers.value
    .filter(p => p.score && !isNaN(Number(p.score)))
    .sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''))
    .map(p => ({
      label: (p.examType||'') + '\n' + (p.createdAt||'').slice(5),
      score: Number(p.score)
    }))
})
const chartW = 500; const chartH = 250
const yMax = computed(() => Math.max(100, Math.ceil((Math.max(...chartData.value.map(d => d.score), 0) + 10) / 10) * 10))
const yStep = computed(() => Math.round(yMax.value / 4))
const xPos = (i) => chartData.value.length > 1 ? 40 + (i / (chartData.value.length - 1)) * (chartW - 50) : chartW / 2
const yPos = (score) => 20 + (1 - score / yMax.value) * (chartH - 60)
const linePoints = computed(() => chartData.value.map((d,i) => `${xPos(i)},${yPos(d.score)}`).join(' '))
const examImages = computed(() => {
  const d = examDetail.value
  const raw = d?.paperImages || d?.paper_images || d?.paperImageUrl || d?.paper_image_url
  if (!raw) return []
  // 统一转为字符串数组
  let arr = []
  if (Array.isArray(raw)) {
    arr = raw.map(i => (typeof i === 'object' ? (i.url||i.src||'') : (i||''))).map(String)
  } else {
    const str = String(raw)
    if (str.startsWith('data:')) { arr = [str] }
    else {
      try { const p = JSON.parse(str); if (Array.isArray(p)) arr = p.map(i => (typeof i === 'object' ? (i.url||i.src||'') : (i||''))).map(String) } catch { arr = str.split(/[,\n]/).map(s => s.trim()) }
    }
  }
  // 过滤空白、非图片文本、残缺 data URL（无逗号即无实际数据）
  return arr.filter(v => v && v.length > 10 && !/^[一-龥a-zA-Z\s，。！？、；：""''（）]+$/.test(v) && (!v.startsWith('data:') || v.includes(',')))
})
async function loadExams() { try { const r = await http.get('/teacher/exam-papers?subject=math'); examPapers.value = (r?.list||r||[]) } catch {} }
const showExamDetail = ref(false)
const examDetail = ref(null)
const examAnalysisEdit = ref('')
const examSuggestionsEdit = ref('')
const examKpListEdit = ref('')

async function viewExam(row) {
  try {
    const r = await http.get(`/teacher/exam-papers/${row.id}`)
    examDetail.value = r
    examAnalysisEdit.value = r.paperAnalysis || ''
    examSuggestionsEdit.value = r.suggestions || ''
    examKpListEdit.value = r.kpList || ''
    showExamDetail.value = true
  } catch (e) { ElMessage.error('加载失败') }
}

async function saveExamDetail() {
  if (!examDetail.value) return
  try {
    await http.put(`/teacher/exam-papers/${examDetail.value.id}`, {
      paperAnalysis: examAnalysisEdit.value,
      suggestions: examSuggestionsEdit.value,
      kpList: examKpListEdit.value
    })
    ElMessage.success('已保存')
    showExamDetail.value = false
    loadExams()
  } catch (e) { ElMessage.error(e.message||'保存失败') }
}
async function delExam(row) { try { await ElMessageBox.confirm('确认删除？','删除',{type:'warning'}); await http.delete(`/teacher/exam-papers/${row.id}`); loadExams() } catch {} }
let showHomeworkForm = ref(false); let showCorrect = ref(false); let showPreviewHw = ref(false)
const hwForm = reactive({ title:'', desc:'', studentIds:[] }); const hwList = ref([])
const hwSubsMap = reactive({})  // homeworkId → submissions[]
const hwStatusFilter = ref(''); const hwStudentFilter = ref(null); const hwDateFilter = ref('')
const hwSubList = ref([]); const hwCurrent = ref(null); const corrIdx = ref(0)
const corrImgs = ref([]); const answerImgs = ref([]); const previewHw = ref('')
const corrSub = computed(() => hwSubList.value[corrIdx.value]||null)

const hwFlatRows = computed(() => {
  const rows = []
  hwList.value.forEach(hw => {
    const subs = hwSubsMap[hw.id] || []
    if (subs.length === 0) {
      rows.push({ homeworkId:hw.id, title:hw.title, studentName:'无', status:'pending', createdAt:hw.createdAt?.slice(0,10) })
    } else {
      subs.forEach(s => {
        rows.push({
          homeworkId:hw.id, title:hw.title, studentId:s.studentId,
          studentName:s.studentName||'未知', status:s.status||'pending',
          submittedImageUrl:s.submittedImageUrl, correctedImageUrl:s.correctedImageUrl,
          createdAt:hw.createdAt?.slice(0,10)
        })
      })
    }
  })
  return rows
})
const filteredHwRows = computed(() => {
  return hwFlatRows.value.filter(row => {
    if (hwStatusFilter.value && row.status !== hwStatusFilter.value) return false
    if (hwStudentFilter.value && row.studentId !== hwStudentFilter.value) return false
    if (hwDateFilter.value && row.createdAt !== hwDateFilter.value) return false
    return true
  })
})

async function loadHw() {
  try {
    const r = await http.get('/teacher/homework?subject=math')
    const hws = (r?.list || r || [])
    hwList.value = hws
    const results = await Promise.all(hws.map(hw =>
      http.get(`/teacher/homework/${hw.id}/submissions`).catch(() => ({}))
    ))
    results.forEach((res, i) => {
      hwSubsMap[hws[i].id] = (res?.list || res || []).map(s => {
        if (s.submittedImageUrl) {
          const val = String(s.submittedImageUrl)
          s.submittedImages = val.startsWith('data:') ? [{ url: val }] : val.split(',').map(u => ({ url: u.trim() })).filter(i => i.url)
        }
        return s
      })
    })
  } catch {}
}
async function createHomework() {
  if (!hwForm.title) return
  try { await http.post('/teacher/homework', { subject:'math', title:hwForm.title, description:hwForm.desc, studentIds:hwForm.studentIds }); showHomeworkForm=false; hwForm.title=''; hwForm.desc=''; hwForm.studentIds=[]; loadHw(); ElMessage.success('已布置') } catch(e) { ElMessage.error(e.message) }
}
// 加载当前学生的已有批改图
function loadExistingCorr() {
  const s = corrSub.value
  const base64s = s?.correctedImageUrl
    ? String(s.correctedImageUrl).split('\n').filter(Boolean).map(u => u.trim())
    : []
  corrImgs.value = [...base64s.map(u => ({ url: u, existing: true })), ...corrImgs.value.filter(i => !i.existing)]
}
watch(corrIdx, () => { loadExistingCorr() })

async function openCorrect(row) {
  hwCurrent.value = row; corrIdx.value = 0
  hwSubList.value = hwSubsMap[row.id] || []
  // 加载已有答案解析
  const hw = hwList.value.find(h => h.id === row.id)
  answerImgs.value = hw?.answerFileUrl
    ? String(hw.answerFileUrl).split('\n').filter(Boolean).map(u => ({ url: u.trim(), existing: true }))
    : []
  corrImgs.value = []
  loadExistingCorr()
  showCorrect.value = true
}
function onCorrPaste(e) {
  for (const item of e.clipboardData?.items||[]) {
    if (item.type.startsWith('image/')) { e.preventDefault(); corrImgs.value.push({ url:URL.createObjectURL(item.getAsFile()), file:item.getAsFile() }); return }
  }
}
function onAnswerPaste(e) {
  for (const item of e.clipboardData?.items||[]) {
    if (item.type.startsWith('image/')) { e.preventDefault(); answerImgs.value.push({ url:URL.createObjectURL(item.getAsFile()), file:item.getAsFile() }); return }
  }
}
function onCorrUpload(f) { if (f?.raw) corrImgs.value.push({ url:URL.createObjectURL(f.raw), file:f.raw }) }
function onAnswerUpload(f) { if (f?.raw) answerImgs.value.push({ url:URL.createObjectURL(f.raw), file:f.raw }) }
async function saveCorrect() {
  const s = corrSub.value; if (!s||!hwCurrent.value) return
  // 批改图片：只上传新增的
  const newCorr = corrImgs.value.filter(i => !i.existing)
  if (newCorr.length) {
    for (const f of newCorr) {
      const img = await fileToBase64(f.file||f.url)
      try { await http.post(`/teacher/homework/${hwCurrent.value.id}/correct`, { studentId:s.studentId, correctedImageUrl:img }) } catch {}
    }
  }
  // 答案解析：完整列表（已有+新增）
  if (answerImgs.value.length) {
    const allUrls = answerImgs.value.map(i => i.url)
    try { await http.post(`/teacher/homework/${hwCurrent.value.id}/answer`, { answerFileUrl:allUrls.join('\n'), answerFileName:'批改解析' }) } catch {}
  }
  ElMessage.success('已保存'); showCorrect.value = false; loadHw()
}
async function delHomework(row) { try { await ElMessageBox.confirm('删除？','确认',{type:'warning'}); await http.delete(`/teacher/homework/${row.id}`); loadHw() } catch {} }
// 通用图片转base64
function fileToBase64(input) {
  return new Promise(resolve => {
    const file = input instanceof File ? input : null
    if (file) { const r=new FileReader(); r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=800;c.height=Math.round(i.height*800/i.width);c.getContext('2d').drawImage(i,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',0.7))};i.src=r.result};r.readAsDataURL(file) }
    else { resolve(input) }
  })
}
onMounted(async () => { loadKpResources(); loadKps(); loadQuestions(); loadExams(); loadHw(); try { const r = await getTeacherMathStudents(); studentList.value = Array.isArray(r) ? r : (r?.data ?? []) } catch {} })
const filteredKps=computed(()=>kps.value.filter(k=>!kpGradeFilter.value||k.gradeLevel===kpGradeFilter.value))
const pagedKps=computed(()=>{const s=(kpPage.value-1)*15;return filteredKps.value.slice(s,s+15)})
function openKpForm(row){ editingKp.value=row||null; kpForm.name=row?.name||''; kpForm.gradeLevel=row?.gradeLevel||''; showKpForm.value=true }
async function saveKp(){ if(!kpForm.name) return ElMessage.warning('请输入名称')
    try { if(editingKp.value){ await updateKnowledgePoint(editingKp.value.id, kpForm); ElMessage.success('已更新') }
    else { await createKnowledgePoint({ subject:"math", name:kpForm.name, gradeLevel:kpForm.gradeLevel }); ElMessage.success('已添加') };   showKpForm.value=false; loadKps() } catch(e) { ElMessage.error(e.message||"保存失败") }
}
async function delKp(row){ await ElMessageBox.confirm("删除","确认",{type:"warning"}); try { await deleteKnowledgePoint(row.id); loadKps(); kpSelection.value=[]; ElMessage.success("已删除") } catch(e) { ElMessage.error(e.message||"失败") } }
async function batchDelKps(){ if(!kpSelection.value.length)return; await ElMessageBox.confirm(`确认删除${kpSelection.value.length}个知识点？`,"批量删除",{type:"warning"}); try { for(const k of kpSelection.value){ await deleteKnowledgePoint(k.id) }; loadKps(); kpSelection.value=[]; ElMessage.success("已删除") } catch(e) { ElMessage.error(e.message||"失败") } }

const qSearch=ref(''); const qKpFilter=ref(null); const qGradeFilter=ref(''); const qTypeFilter=ref(''); const qQuestionType=ref(''); const qStudentFilter=ref(null); const qSharedFilter=ref(null); const qDateFilter=ref(''); const qPage=ref(1)
const showQDetail=ref(false); const currentQ=ref(null)
const qIsOwner=computed(()=>canManageQ(currentQ.value))
const filteredKpsForGrade = computed(() => qGradeFilter.value ? kps.value.filter(k => k.gradeLevel === qGradeFilter.value) : kps.value)
const studentList=ref([])
const questions=ref([
  { id:1,type:'NEW',questionType:'解答题',shared:true,title:'已知二次函数 y=x²-4x+3, 求最小值及对应 x 值。',kpIds:[1,2],kpNames:['二次函数','最值问题'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'NONE',teacherAnalysis:'',teacherAnalysisImage:'',studentName:'',difficulty:'MEDIUM',gradeLevel:'初三·上学期',solution:'配方: y=(x-2)²-1, min=-1(x=2)',createdAt:'2026-07-05' },
  { id:2,type:'WRONG',questionType:'选择题',shared:true,title:'解一元二次方程 2x²-5x+2=0',kpIds:[3,4],kpNames:['一元二次方程','求根公式'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'AUTO',teacherAnalysis:'注意引导学生区分 a,b,c 的符号',teacherAnalysisImage:'',studentName:'白克林',studentId:1,difficulty:'EASY',gradeLevel:'初三·上学期',solution:'x₁=2, x₂=1/2',createdAt:'2026-07-03' },
  { id:3,type:'NEW',questionType:'填空题',shared:false,title:'Rt△ABC, AC=6, BC=8, 求 AB 及 sinA。',kpIds:[6,7],kpNames:['勾股定理','三角函数'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'NONE',teacherAnalysis:'',teacherAnalysisImage:'',studentName:'',difficulty:'EASY',gradeLevel:'初三·下学期',solution:'AB=10, sinA=4/5',createdAt:'2026-07-04' }
])
const filteredQuestions=computed(()=>{
  const list=questions.value.filter(q=>{
    if(qSearch.value&&!q.title.includes(qSearch.value))return false
    if(qKpFilter.value&&!q.kpIds.includes(qKpFilter.value))return false
    if(qGradeFilter.value&&q.gradeLevel!==qGradeFilter.value)return false
    if(qTypeFilter.value&&q.type!==qTypeFilter.value)return false
    if(qTypeFilter.value==='WRONG'&&qStudentFilter.value&&q.studentId!==qStudentFilter.value)return false
    if(qQuestionType.value&&q.questionType!==qQuestionType.value)return false
    if(qSharedFilter.value!==null&&q.shared!==qSharedFilter.value)return false
    if(qDateFilter.value&&q.createdAt!==qDateFilter.value)return false;return true
  }); return list
})
const pagedQuestions=computed(()=>{
  const start=(qPage.value-1)*15; return filteredQuestions.value.slice(start,start+15)
})
async function viewQuestion(q){
  currentQ.value={...q, kpIds:(q.knowledgePointIds||'').split(',').filter(Boolean).map(Number), shared:(q.source==='STUDENT'?false:(q.shared ?? true)), _taEditing:false, _titleEditing:false}
  if (q.title) currentQ.value._titleHtml = await renderMarkdown(q.title)
  if (q.solution) currentQ.value._solutionHtml = await renderMarkdown(q.solution)
  // 如果老师解析为空，用 solution 兜底
  if (!currentQ.value.teacherAnalysis && currentQ.value.solution) {
    currentQ.value.teacherAnalysis = currentQ.value.solution
  }
  await previewTeacherAnalysis()
  showQDetail.value=true
}
async function onTeacherPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      compressAndSetImg(item.getAsFile())
      return
    }
  }
}
async function uploadAnalysisImage(file){ if(!currentQ.value||!file.raw)return; compressAndSetImg(file.raw) }
async function confirmTitleEdit() {
  if (!currentQ.value) return
  if (!(currentQ.value.title || '').trim()) { ElMessage.warning('题目内容不能为空'); return }
  currentQ.value._titleHtml = await renderMarkdown(currentQ.value.title || '')
  currentQ.value._titleEditing = false
}
async function previewTeacherAnalysis() {
  if (!currentQ.value) return
  let html = currentQ.value.teacherAnalysis ? await renderMarkdown(currentQ.value.teacherAnalysis) : ''
  if (currentQ.value.teacherAnalysisImage) {
    const src = currentQ.value.teacherAnalysisImage?.startsWith('data:') ? currentQ.value.teacherAnalysisImage : resolveStaticUrl(currentQ.value.teacherAnalysisImage||'')
    html += `<img src="${src}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:8px"/>`
  }
  currentQ.value._taPreview = html || '暂无解析内容'
}
function compressAndSetImg(blob) {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const maxW = 800
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = c.toDataURL('image/jpeg', 0.7)
      if (currentQ.value) { currentQ.value.teacherAnalysisImage = dataUrl; ElMessage.success('解析配图已上传') }
    }
    img.src = reader.result
  }
  reader.readAsDataURL(blob)
}
async function delQuestion(row){ try { await ElMessageBox.confirm('确认删除该题目？','删除',{type:'warning'}); await deleteTeacherQuestion(row.id); ElMessage.success('已删除'); loadQuestions(); qSelection.value=[] } catch(e) { if(e!=='cancel') ElMessage.error(e.message||'删除失败') } }
async function batchDelQuestions(){ if(!qSelection.value.length)return; await ElMessageBox.confirm(`确认删除${qSelection.value.length}道题？`,"批量删除",{type:"warning"}); try { for(const q of qSelection.value){ await deleteTeacherQuestion(q.id) }; loadQuestions(); qSelection.value=[]; ElMessage.success("已删除") } catch(e) { ElMessage.error(e.message||"失败") } }
function uploadDiagram(file){ if(!currentQ.value)return; currentQ.value.diagramImageUrl=URL.createObjectURL(file.raw); currentQ.value.diagramStatus='MANUAL'; ElMessage.success('配图已更新') }
async function saveQDetail(){
  if(!currentQ.value) return
  try {
    await updateTeacherQuestion(currentQ.value.id, {
      title: currentQ.value.title,
      shared: currentQ.value.shared,
      knowledgePointIds: (currentQ.value.kpIds||[]).join(','),
      difficulty: currentQ.value.difficulty,
      teacherAnalysis: currentQ.value.teacherAnalysis,
      diagramImageUrl: currentQ.value.diagramImageUrl,
      teacherAnalysisImage: currentQ.value.teacherAnalysisImage,
      diagramStatus: currentQ.value.diagramStatus
    })
    ElMessage.success('保存成功')
    showQDetail.value = false
    loadQuestions()  // 重新加载，刷新知识点显示
  } catch(e) { ElMessage.error(e.message||'保存失败') }
}

// === 上传题目 ===
const upType=ref('NEW'); const upQuestionType=ref('选择题'); const upShared=ref(true); const upText=ref(''); const upImages=ref([]); const upOcrLoading=ref(false)
const upPreviewShow=ref(false); const upPreviewHtml=ref(''); const upRawOcr=ref('')
const upDifficulty=ref('MEDIUM'); const upKpIds=ref([]);const upDiagramUrl=ref('')
const upDiagramText=ref('')
const upSolText=ref(''); const upSolImages=ref([]); const upSolLoading=ref(false); const upSolRaw=ref(''); const upSolPreview=ref('')
// 上传模式：单题 / 批量
const uploadMode=ref('single')
// === 截图配图 ===
const showCrop=ref(false); const cropSrc=ref(''); const cropImgEl=ref(null); const cropWrap=ref(null); const cropReady=ref(false)
const cropRect=reactive({x:0,y:0,w:0,h:0})
let cropDragHandle=''; let cropDragStart=null
const cropBoxStyle=computed(()=>({left:cropRect.x+'px',top:cropRect.y+'px',width:cropRect.w+'px',height:cropRect.h+'px'}))
function openCropDiagram(){
  const img=upImages.value[0]
  if(!img){ ElMessage.warning('请先在「题目内容」上传或粘贴原图'); return }
  cropSrc.value=img.url; cropReady.value=false; showCrop.value=true
}
function initCrop(){
  const img=cropImgEl.value; if(!img) return
  const w=img.clientWidth||img.naturalWidth; const h=img.clientHeight||img.naturalHeight
  const cw=w*0.8, ch=h*0.8
  cropRect.x=(w-cw)/2; cropRect.y=(h-ch)/2; cropRect.w=cw; cropRect.h=ch
  cropReady.value=true
}
function startCropDrag(handle,e){
  const img=cropImgEl.value; if(!img) return
  cropDragHandle=handle
  cropDragStart={x:e.clientX,y:e.clientY,left:cropRect.x,top:cropRect.y,right:cropRect.x+cropRect.w,bottom:cropRect.y+cropRect.h,imgW:img.clientWidth||img.naturalWidth,imgH:img.clientHeight||img.naturalHeight}
  window.addEventListener('pointermove',onCropMove); window.addEventListener('pointerup',onCropUp)
  e.preventDefault()
}
function onCropMove(e){
  if(!cropDragStart) return
  const dx=e.clientX-cropDragStart.x, dy=e.clientY-cropDragStart.y, MIN=20
  let {left,top,right,bottom,imgW,imgH}=cropDragStart
  if(cropDragHandle==='move'){
    const w=right-left, h=bottom-top
    left=Math.max(0,Math.min(cropDragStart.left+dx,imgW-w)); top=Math.max(0,Math.min(cropDragStart.top+dy,imgH-h))
    right=left+w; bottom=top+h
  }else{
    if(cropDragHandle.includes('w')) left=cropDragStart.left+dx
    if(cropDragHandle.includes('e')) right=cropDragStart.right+dx
    if(cropDragHandle.includes('n')) top=cropDragStart.top+dy
    if(cropDragHandle.includes('s')) bottom=cropDragStart.bottom+dy
    left=Math.max(0,Math.min(left,right-MIN)); right=Math.min(imgW,Math.max(right,left+MIN))
    top=Math.max(0,Math.min(top,bottom-MIN)); bottom=Math.min(imgH,Math.max(bottom,top+MIN))
  }
  cropRect.x=left; cropRect.y=top; cropRect.w=right-left; cropRect.h=bottom-top
}
function onCropUp(){
  cropDragHandle=''; cropDragStart=null
  window.removeEventListener('pointermove',onCropMove); window.removeEventListener('pointerup',onCropUp)
}
function confirmCrop(){
  const img=cropImgEl.value; if(!img) return
  const sx=img.naturalWidth/(img.clientWidth||img.naturalWidth); const sy=img.naturalHeight/(img.clientHeight||img.naturalHeight)
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(cropRect.w*sx)); c.height=Math.max(1,Math.round(cropRect.h*sy))
  c.getContext('2d').drawImage(img,cropRect.x*sx,cropRect.y*sy,cropRect.w*sx,cropRect.h*sy,0,0,c.width,c.height)
  upDiagramUrl.value=c.toDataURL('image/png'); showCrop.value=false; ElMessage.success('配图已截取')
}

function onUpSolPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      upSolImages.value.push({ url: URL.createObjectURL(blob), file: blob })
      upSolText.value = 'OCR图片'  // 标记有图片内容
      return
    }
  }
}
async function doSolOCR(){
  if(!upSolImages.value.length) return
  upSolLoading.value=true
  for (const img of upSolImages.value) {
    try {
      const fd=new FormData(); fd.append('file', img.file)
      const res=await fetch('/ocr',{method:'POST',body:fd})
      const data=await res.json()
      if (data.text) upSolRaw.value += '\n' + data.text.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '').trim()
    } catch {}
  }
  upSolImages.value=[]; upSolText.value=''
  upSolPreview.value = await renderMarkdown(upSolRaw.value)
  upSolLoading.value=false
}
function doSolDirect(){
  // 直接把粘贴的图片转为img标签插入解析编辑区
  for (const img of upSolImages.value) {
    // 图片转base64嵌入
    const r = new FileReader()
    r.onload = () => { upSolRaw.value += `\n![](${r.result})\n`; upSolImages.value = []; upSolText.value = '' }
    r.readAsDataURL(img.file)
    return  // 只处理第一张
  }
  upSolImages.value = []; upSolText.value = ''
}
watch(upSolRaw, async (v) => { upSolPreview.value = await renderMarkdown(v || '') })

function onUpDiagramPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      upDiagramUrl.value = URL.createObjectURL(item.getAsFile())
      return
    }
  }
}
function onContentPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const maxW = 800; let w = img.width, h = img.height
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
          const c = document.createElement('canvas'); c.width = w; c.height = h
          c.getContext('2d').drawImage(img, 0, 0, w, h)
          const dataUrl = c.toDataURL('image/jpeg', 0.7)
          const ta = e.target; const start = ta.selectionStart
          const imgMd = `\n![](${dataUrl})\n`
          // 根据 textarea 的 placeholder 判断是题目还是解析
          if (ta.placeholder && ta.placeholder.includes('解析')) {
            upSolRaw.value = upSolRaw.value.slice(0, start) + imgMd + upSolRaw.value.slice(start)
          } else {
            upRawOcr.value = upRawOcr.value.slice(0, start) + imgMd + upRawOcr.value.slice(start)
          }
        }
        img.src = reader.result
      }
      reader.readAsDataURL(blob)
      return
    }
  }
}
function onUpPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      upImages.value.push({ url: URL.createObjectURL(blob), file: blob })
      return
    }
  }
}
async function doUploadOCR(){
  if(!upText.value.trim()&&!upImages.value.length) return
  upOcrLoading.value=true; upPreviewShow.value=true; upPreviewHtml.value='识别中…'
  let allText = upText.value.trim()
  for (const img of upImages.value) {
    try {
      const fd=new FormData(); fd.append('file', img.file)
      const res=await fetch('/ocr',{method:'POST',body:fd})
      const data=await res.json()
      if (data.text) {
        // OCR配图手动添加，去掉img和div标签
        let txt = data.text.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '').trim()
        allText += '\n' + txt
      }
    } catch {}
  }
  upRawOcr.value=allText
  upPreviewHtml.value = await renderMarkdown(allText)
  upOcrLoading.value=false
}
function onUpDiagram(file){ if(file?.raw){ upDiagramUrl.value=URL.createObjectURL(file.raw) } }
function stripBase64Images(text){
  // 剥离 markdown 里内嵌的 base64 data URL，避免撑爆后端 TEXT(64KB) 列
  const images = []
  const cleaned = (text || '').replace(/!\[[^\]]*\]\((data:image\/[^)]+)\)/gi, (_, src) => {
    images.push(src)
    return '[图片]'
  }).replace(/\n{3,}/g, '\n\n').trim()
  return { cleaned, images }
}
async function submitUpload(){
  if(!upRawOcr.value.trim()) return
  // 从选中知识点自动获取年级学期
  const firstKp = kps.value.find(k => upKpIds.value.includes(k.id))
  // 剥离 title/solution 里内嵌的 base64 图（图统一由 originalImageUrl 承载）
  const titleRes = stripBase64Images(upRawOcr.value)
  const solRes = stripBase64Images(upSolRaw.value)
  // 原图转 base64
  let origImg = ''
  if (upImages.value[0]?.file) {
    origImg = await new Promise(resolve => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(upImages.value[0].file)
    })
  }
  // 文本里剥出的图，若原图位空则补进 originalImageUrl（后端已解码存 URL）
  if (!origImg) {
    const extracted = [...titleRes.images, ...solRes.images]
    if (extracted.length) origImg = extracted[0]
  }
  try {
    await uploadTeacherQuestion({
      subject:'math', type:upType.value, questionType:upQuestionType.value, shared:upShared.value,
      title:titleRes.cleaned,
      difficulty:upDifficulty.value, gradeLevel:firstKp?.gradeLevel||'',
      knowledgePointIds:upKpIds.value.join(','),
      originalImageUrl:origImg, diagramImageUrl:upDiagramUrl.value,
      solution:solRes.cleaned, teacherAnalysis:solRes.cleaned,
      diagramStatus:upDiagramUrl.value?'MANUAL':'NONE'
    })
    ElMessage.success('上传成功'); resetUp(); loadQuestions()
  } catch(e){ ElMessage.error(e.message||'上传失败') }
}
function resetUp(){ upText.value=''; upImages.value=[]; upPreviewShow.value=false; upPreviewHtml.value=''; upRawOcr.value=''; upDiagramUrl.value=''; upDiagramText.value=''; upKpIds.value=[]; upSolText.value=''; upSolImages.value=[]; upSolRaw.value=''; upSolPreview.value='' }
watch(upRawOcr, async (v) => { if (v) upPreviewHtml.value = await renderMarkdown(v) })
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.mt-lg{margin-top:var(--space-lg)}.mt-sm{margin-top:8px}.filter-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.q-detail h4{font-size:14px;margin-bottom:6px}.img-box{background:var(--color-bg-alt);border-radius:8px;min-height:100px;display:flex;align-items:center;justify-content:center;overflow:hidden}.detail-img{max-width:100%;max-height:260px;object-fit:contain}
.text-box{background:#F8FAFC;padding:10px;border-radius:8px;font-size:13px;line-height:1.6;color:#555;word-break:break-word;overflow-wrap:break-word}.text-box :deep(.katex){font-size:.9em}.d-solution{background:#F0FDF4;padding:12px;border-radius:8px;font-size:13px;line-height:1.8;white-space:pre-wrap;font-family:monospace}
.kpr-upload{margin-bottom:8px}.kpr-list{display:flex;flex-direction:column;gap:6px}.kpr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--color-bg);border:1px solid var(--color-border-light)}.kpr-name{flex:1;font-size:13px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kpr-size{font-size:11px;color:var(--text-muted)}
.up-zone{border:2px dashed #ccc;border-radius:16px;padding:40px;text-align:center;cursor:pointer;transition:all .2s}.up-zone:hover{border-color:var(--color-primary);background:rgba(99,102,241,.04)}.up-icon{color:var(--color-primary);margin-bottom:8px}.up-zone p{font-size:14px;color:#888}.up-imgs{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.up-img-item{position:relative;width:80px;height:80px}.up-img-item img{width:100%;height:100%;object-fit:cover;border-radius:6px;border:1px solid #eee}.up-img-del{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#EF4444;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer}.up-preview-box{background:#F8FAFC;padding:12px;border-radius:8px;font-size:13px;line-height:1.8;min-height:40px}.up-preview-box :deep(.katex){font-size:.9em}
.analyzing{text-align:center;padding:40px}.az-spinner{display:flex;gap:8px;justify-content:center;margin-bottom:12px}.spinner-dot{width:10px;height:10px;border-radius:50%;background:var(--color-primary);animation:dotPulse 1.4s infinite}.spinner-dot:nth-child(2){animation-delay:.2s}.spinner-dot:nth-child(3){animation-delay:.4s}@keyframes dotPulse{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
/* 作业批改弹窗缩略图 */
.corr-body .hw-imgs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.corr-body .hw-img-item{position:relative;width:100px;height:100px;cursor:pointer}
.corr-body .hw-img-item img{width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid #eee}
.corr-body .hw-img-item:hover img{opacity:.85}
.corr-body .hw-img-del{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#EF4444;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1}
.corr-paste{cursor:text}
.corr-title{font-size:14px;font-weight:700;margin:12px 0 6px;color:#333}
.exam-detail .ed-row{display:flex;gap:12px;align-items:center;margin-bottom:6px;font-size:14px;color:#555}
.ed-label{color:var(--text-muted);min-width:50px}
.score-chart{background:#fff;border-radius:12px;padding:12px 16px;margin-top:12px;border:1px solid var(--color-border)}
.sc-svg{width:100%;height:auto;max-height:260px}
.exam-detail .hw-imgs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.exam-detail .hw-img-item{position:relative;width:120px;height:120px;cursor:pointer}
.exam-detail .hw-img-item img{width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid #eee}
.exam-detail .hw-img-item:hover img{opacity:.85}
/* 截图配图 */
.crop-wrap{position:relative;display:inline-block}
.crop-src-img{display:block;max-width:760px;max-height:60vh}
.crop-box{position:absolute;border:2px solid #3B82F6;box-sizing:border-box;cursor:move;touch-action:none}
.crop-handle{position:absolute;width:10px;height:10px;background:#fff;border:1px solid #3B82F6;border-radius:2px;touch-action:none}
.ch-nw{left:-6px;top:-6px;cursor:nwse-resize}.ch-n{left:50%;top:-6px;margin-left:-5px;cursor:ns-resize}.ch-ne{right:-6px;top:-6px;cursor:nesw-resize}
.ch-e{right:-6px;top:50%;margin-top:-5px;cursor:ew-resize}.ch-se{right:-6px;bottom:-6px;cursor:nwse-resize}.ch-s{left:50%;bottom:-6px;margin-left:-5px;cursor:ns-resize}
.ch-sw{left:-6px;bottom:-6px;cursor:nesw-resize}.ch-w{left:-6px;top:50%;margin-top:-5px;cursor:ew-resize}
</style>
