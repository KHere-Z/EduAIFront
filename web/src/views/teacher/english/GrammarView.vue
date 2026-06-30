<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>语法体系</h2>
        <p>系统学习英语核心语法点，按分类快速查阅</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧分类导航 -->
      <el-col :xs="24" :md="6">
        <el-card class="category-sidebar">
          <div class="category-title">语法分类</div>
          <div
            v-for="cat in categories"
            :key="cat.key"
            :class="['category-item', { active: activeCategory === cat.key }]"
            @click="activeCategory = cat.key"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-label">{{ cat.label }}</span>
            <span class="cat-count">{{ cat.items.length }}</span>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :xs="24" :md="18">
        <!-- 折叠面板 -->
        <el-card class="mb-lg">
          <el-collapse v-model="activeNames" accordion>
            <el-collapse-item
              v-for="item in currentItems"
              :key="item.id"
              :title="item.name"
              :name="item.id"
            >
              <div class="grammar-detail">
                <div class="detail-section">
                  <span class="detail-label">结构公式</span>
                  <code class="formula">{{ item.formula }}</code>
                </div>
                <div class="detail-section">
                  <span class="detail-label">用法说明</span>
                  <p>{{ item.usage }}</p>
                </div>
                <div class="detail-section">
                  <span class="detail-label">例句</span>
                  <div v-for="(ex, i) in item.examples" :key="i" class="example-item">
                    <div class="example-en">{{ ex.en }}</div>
                    <div class="example-cn">{{ ex.cn }}</div>
                  </div>
                </div>
                <div class="detail-section" v-if="item.keyPoints">
                  <span class="detail-label">易错提示</span>
                  <ul class="keypoints-list">
                    <li v-for="kp in item.keyPoints" :key="kp">{{ kp }}</li>
                  </ul>
                </div>
                <el-button type="primary" size="small" @click="selectForPractice(item)" style="margin-top:12px">
                  去练习造句
                </el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 选中语法点详情面板 -->
        <el-card v-if="selectedGrammar">
          <template #header>
            <span class="card-title">{{ selectedGrammar.name }} — 详细讲解</span>
          </template>
          <div class="detail-panel">
            <div class="panel-section">
              <h4>定义</h4>
              <p>{{ selectedGrammar.usage }}</p>
            </div>
            <div class="panel-section">
              <h4>公式</h4>
              <code class="formula-large">{{ selectedGrammar.formula }}</code>
            </div>
            <div class="panel-section">
              <h4>更多例句</h4>
              <div v-for="(ex, i) in selectedGrammar.examples" :key="i" class="example-block">
                <div class="example-number">{{ i + 1 }}</div>
                <div>
                  <div class="example-en">{{ ex.en }}</div>
                  <div class="example-cn">{{ ex.cn }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeCategory = ref('tense')
const activeNames = ref([])

const categories = [
  {
    key: 'tense', icon: '&#9200;', label: '时态',
    items: [
      { id: 't1', name: '一般现在时', formula: 'S + V(s/es) + O', usage: '表示经常性、习惯性的动作或普遍真理。', examples: [{ en: 'She reads English every morning.', cn: '她每天早晨读英语。' }, { en: 'The earth moves around the sun.', cn: '地球围绕太阳转。' }], keyPoints: ['主语三单时动词要加 s/es', '表示客观真理时，不论主句时态用一般现在时'] },
      { id: 't2', name: '一般过去时', formula: 'S + V-ed + O', usage: '表示过去某个时间发生的动作或存在的状态。', examples: [{ en: 'I visited the museum yesterday.', cn: '我昨天参观了博物馆。' }, { en: 'They lived in Beijing for five years.', cn: '他们在北京住了五年。' }], keyPoints: ['不规则动词过去式需单独记忆', '注意与现在完成时的区别'] },
      { id: 't3', name: '一般将来时', formula: 'S + will/shall + V + O', usage: '表示将来某个时间要发生的动作或存在的状态。', examples: [{ en: 'We will have a test next week.', cn: '下周我们将有一次考试。' }, { en: 'It is going to rain soon.', cn: '很快就要下雨了。' }], keyPoints: ['will 和 be going to 的区别', 'be about to 表示即将发生的动作'] },
      { id: 't4', name: '现在进行时', formula: 'S + am/is/are + V-ing + O', usage: '表示现在正在进行的动作或当前阶段持续的动作。', examples: [{ en: 'Look! The children are playing in the garden.', cn: '看！孩子们正在花园里玩耍。' }, { en: 'I am working on a new project this month.', cn: '这个月我正在做一个新项目。' }], keyPoints: ['现在进行时可表示将来（如 come, go, leave）', '静态动词（know, believe）通常不用进行时'] },
      { id: 't5', name: '过去进行时', formula: 'S + was/were + V-ing + O', usage: '表示过去某个时间正在进行的动作。', examples: [{ en: 'I was reading when you called.', cn: '你打电话时我正在看书。' }, { en: 'They were having dinner at 7 PM.', cn: '晚上7点他们正在吃晚饭。' }], keyPoints: ['常与 when/while 引导的时间状语连用', 'was/were 的选择取决于主语'] },
      { id: 't6', name: '现在完成时', formula: 'S + have/has + V-ed(pp) + O', usage: '表示过去的动作对现在造成的影响或持续到现在。', examples: [{ en: 'I have finished my homework.', cn: '我已经完成了作业。' }, { en: 'She has lived here since 2015.', cn: '她从2015年起就住在这里。' }], keyPoints: ['already/yet/ever/never 常用于现在完成时', 'since + 时间点 / for + 时间段'] }
    ]
  },
  {
    key: 'voice', icon: '&#128483;', label: '语态',
    items: [
      { id: 'v1', name: '主动语态', formula: 'S + V + O', usage: '主语是动作的执行者，强调"谁做了什么"。', examples: [{ en: 'Tom broke the window.', cn: '汤姆打破了窗户。' }, { en: 'The company launched a new product.', cn: '公司发布了一款新产品。' }] },
      { id: 'v2', name: '被动语态', formula: 'S + be + V-ed(pp) + (by O)', usage: '主语是动作的承受者，强调"被做了什么"。', examples: [{ en: 'The window was broken by Tom.', cn: '窗户被汤姆打破了。' }, { en: 'English is spoken worldwide.', cn: '英语在全球被使用。' }], keyPoints: ['不及物动词没有被动语态', '被动语态常用于科学文献和正式文体'] },
      { id: 'v3', name: '被动语态各种时态', formula: '各种时态下的 be + done 组合', usage: '被动语态在不同时态中 be 动词的变形规则。', examples: [{ en: 'The letter was sent yesterday. (一般过去被动)', cn: '信昨天被寄出了。' }, { en: 'The work is being done now. (现在进行被动)', cn: '这项工作正在被完成。' }, { en: 'The project has been completed. (现在完成被动)', cn: '项目已经完成了。' }] }
    ]
  },
  {
    key: 'clause', icon: '&#128279;', label: '从句',
    items: [
      { id: 'c1', name: '定语从句（关系代词）', formula: 'N + who/which/that + V...', usage: '修饰名词或代词的从句，关系代词在从句中充当主语或宾语。', examples: [{ en: 'The girl who is singing is my sister.', cn: '正在唱歌的那个女孩是我的妹妹。' }, { en: 'This is the book that I bought yesterday.', cn: '这就是我昨天买的那本书。' }], keyPoints: ['who 指人, which 指物, that 均可指', '限制性 vs 非限制性定语从句（逗号区别）'] },
      { id: 'c2', name: '名词性从句', formula: 'That/What/Whether + 完整句', usage: '在句中充当主语、宾语、表语或同位语的从句。', examples: [{ en: 'What he said surprised everyone.', cn: '他说的话让所有人惊讶。' }, { en: 'I don\'t know whether she will come.', cn: '我不知道她是否会来。' }], keyPoints: ['that 在宾语从句中可省略', 'what = the thing that'] },
      { id: 'c3', name: '状语从句', formula: 'When/If/Because/Although + 从句, 主句', usage: '表示时间、条件、原因、让步等关系的从句。', examples: [{ en: 'When spring comes, flowers bloom.', cn: '当春天来临时，花开了。' }, { en: 'If it rains tomorrow, we will stay home.', cn: '如果明天下雨，我们就待在家。' }], keyPoints: ['条件状语从句用现在时表将来', '时态呼应规则'] }
    ]
  },
  {
    key: 'lexical', icon: '&#128220;', label: '词法',
    items: [
      { id: 'l1', name: '冠词用法', formula: 'a/an/the/零冠词 + N', usage: '不定冠词表泛指，定冠词表特指，零冠词用于抽象/复数泛指。', examples: [{ en: 'I saw a cat in the garden.', cn: '我在花园里看到一只猫。' }, { en: 'The cat on the roof is black.', cn: '屋顶上的那只猫是黑色的。' }, { en: 'Cats are lovely animals.', cn: '猫是可爱的动物（零冠词泛指）。' }], keyPoints: ['首次提及用 a/an，再次提及时用 the', '独一无二的事物前用 the（the sun, the moon）'] },
      { id: 'l2', name: '情态动词', formula: 'S + modal V + V(base) + O', usage: '表示能力、许可、义务、可能性等语气的动词。', examples: [{ en: 'You must finish the work today.', cn: '你必须今天完成工作。' }, { en: 'She can speak three languages.', cn: '她会说三种语言。' }, { en: 'You should see a doctor.', cn: '你应该去看医生。' }], keyPoints: ['must 强调主观义务, have to 强调客观需要', 'could/might 可表示委婉语气'] },
      { id: 'l3', name: '非谓语动词', formula: 'V-ing / to V / V-ed 的非谓语用法', usage: '动词的非谓语形式可在句中作主语、宾语、定语、状语等。', examples: [{ en: 'Swimming is good for health. (动名词作主语)', cn: '游泳对健康有益。' }, { en: 'I want to go home. (不定式作宾语)', cn: '我想回家。' }, { en: 'The broken vase lay on the floor. (分词作定语)', cn: '破碎的花瓶躺在地板上。' }], keyPoints: ['有些动词只能接 to do（want, decide）', '有些动词只能接 doing（enjoy, avoid）'] }
    ]
  }
]

const currentItems = computed(() => {
  const cat = categories.find(c => c.key === activeCategory.value)
  return cat ? cat.items : []
})

const selectedGrammar = ref(null)

function selectForPractice(item) {
  selectedGrammar.value = item
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }

/* 侧边栏 */
.category-sidebar { padding: 8px 0; position: sticky; top: 20px; }
.category-title { font-size: 14px; font-weight: 600; color: var(--text-primary); padding: 0 16px 12px; border-bottom: 1px solid var(--color-border-light); margin-bottom: 8px; }
.category-item {
  display: flex; align-items: center; padding: 10px 16px; cursor: pointer;
  transition: all var(--transition); border-radius: var(--radius-sm); margin: 2px 8px;
  font-size: 14px; color: var(--text-secondary);
}
.category-item:hover, .category-item.active {
  background: var(--color-primary-bg); color: var(--color-primary);
}
.cat-icon { margin-right: 10px; font-size: 16px; }
.cat-label { flex: 1; }
.cat-count { font-size: 12px; color: var(--text-muted); }

/* 语法详情 */
.grammar-detail { padding: 4px 0; }
.detail-section { margin-bottom: 16px; }
.detail-label { display: inline-block; font-size: 12px; font-weight: 600; color: var(--color-primary); background: var(--color-primary-bg); padding: 2px 10px; border-radius: 12px; margin-bottom: 8px; }
.formula { display: block; background: var(--color-primary-dark); color: white; padding: 10px 16px; border-radius: var(--radius-sm); font-family: 'SF Mono', 'Fira Code', monospace; font-size: 14px; }
.detail-section p { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
.example-item { padding: 8px 0; }
.example-en { font-size: 14px; color: var(--text-primary); font-style: italic; margin-bottom: 2px; }
.example-cn { font-size: 13px; color: var(--text-muted); }
.keypoints-list { padding-left: 18px; }
.keypoints-list li { font-size: 13px; color: var(--color-warning); margin-bottom: 4px; }

/* 详情面板 */
.detail-panel { padding: 8px 0; }
.panel-section { margin-bottom: 20px; }
.panel-section h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.panel-section p { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
.formula-large { display: block; background: var(--color-primary-dark); color: white; padding: 14px 20px; border-radius: var(--radius-md); font-family: 'SF Mono', 'Fira Code', monospace; font-size: 16px; }
.example-block { display: flex; gap: 12px; padding: 8px 0; }
.example-number {
  width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: var(--color-primary); flex-shrink: 0; margin-top: 2px;
}
</style>
