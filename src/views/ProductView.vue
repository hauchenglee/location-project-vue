<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BrandMark from '@/components/BrandMark.vue'
import LandingIcon from '@/components/LandingIcon.vue'
import ProductPreview from '@/components/ProductPreview.vue'

const emit = defineEmits(['navigate'])

const pageEl = ref(null)
let revealObserver = null

const capabilities = [
  { label: '商業密度', icon: 'store' },
  { label: '人口結構', icon: 'users' },
  { label: '時段人潮', icon: 'pulse' },
  { label: '交通可及', icon: 'transit' },
  { label: '空間熱區', icon: 'grid' },
]

const faqs = [
  {
    question: '我需要準備什麼資料？',
    answer: '只需要一個座標，以及這次想分析的產業類別。品牌名稱、分析範圍與目標年齡層都可以在建立分析時設定。',
  },
  {
    question: '分析範圍可以選多大？',
    answer: '目前提供街道級 250m、步行級 500m 與生活圈 1km 三種常用尺度。三種尺度都用同一套五維指標計算，差別只在觀察的範圍。',
  },
  {
    question: '資料涵蓋哪些地區？',
    answer: '目前以台灣為主要資料範圍，各鄉鎮的商業、人口、人潮與交通資料完整度不同。若某個座標的資料不足，分數與候選生活圈的結果會比較保守。',
  },
  {
    question: '一次分析需要多久？',
    answer: '依範圍與資料量而定。分析完成後，結果會留在分析紀錄裡，方便你回頭比較不同地點。',
  },
  {
    question: '這跟直接看 Google Maps 有什麼不同？',
    answer: '地圖告訴你怎麼走；落子把商業、人口、人潮與交通放在同一套標準上，直接回答「這個點值不值得看」以及「下一個該看哪裡」。',
  },
]

const go = (page) => emit('navigate', page)

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const scrollTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  const targets = pageEl.value?.querySelectorAll('.lp-reveal') || []
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion || typeof IntersectionObserver === 'undefined') {
    targets.forEach((element) => element.classList.add('is-visible'))
    return
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })

  targets.forEach((element) => revealObserver.observe(element))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<template>
  <div ref="pageEl" class="lp">
    <!-- Hero -->
    <section class="lp-hero">
      <div class="lp-hero-grid" aria-hidden="true"></div>
      <span class="lp-orbit lp-orbit--a" aria-hidden="true"></span>
      <span class="lp-orbit lp-orbit--b" aria-hidden="true"></span>
      <span class="lp-orbit lp-orbit--c" aria-hidden="true"></span>

      <header class="lp-nav">
        <button class="lp-brand" type="button" @click="scrollTop">
          <BrandMark :size="34" />
          <span class="lp-brand-text">
            <span class="lp-brand-name">落子<small>luozi</small></span>
            <span class="lp-brand-sub">Decision Platform</span>
          </span>
        </button>

        <nav class="lp-nav-links" aria-label="產品頁導覽">
          <button type="button" @click="scrollToSection('why')">為什麼</button>
          <button type="button" @click="scrollToSection('what')">功能</button>
          <button type="button" @click="scrollToSection('uses')">適用場景</button>
          <button type="button" @click="scrollToSection('how')">怎麼用</button>
          <button type="button" @click="scrollToSection('faq')">常見問題</button>
        </nav>

        <button class="lp-nav-cta" type="button" @click="go('create')">
          開始分析 <span aria-hidden="true">→</span>
        </button>
      </header>

      <div class="lp-hero-inner">
        <div class="lp-hero-copy">
          <p class="lp-eyebrow"><span aria-hidden="true"></span> LUOZI · 區位決策平台</p>
          <h1>選對位置，<br><span>先看清全貌。</span></h1>
          <p class="lp-lede">
            給落子一個座標，它會把商業、人口、人潮與交通放在同一個畫面上。
            讓你在展店、找客戶或觀察商圈時，更快做出有依據的決定。
          </p>

          <div class="lp-actions">
            <button class="lp-btn lp-btn--primary" type="button" @click="go('create')">
              開始分析 <span class="lp-arrow" aria-hidden="true">→</span>
            </button>
            <button class="lp-btn lp-btn--ghost" type="button" @click="go('records')">
              看範例分析
            </button>
          </div>

          <ul class="lp-hero-points" aria-label="產品特色">
            <li><LandingIcon name="check" :size="15" /> 商業、人口、人潮、交通一次看</li>
            <li><LandingIcon name="check" :size="15" /> 自動整理候選生活圈與綜合評分</li>
            <li><LandingIcon name="check" :size="15" /> 結果留在紀錄裡，可以回頭比較</li>
          </ul>

          <p class="lp-hero-note">
            <LandingIcon name="shield" :size="15" />
            不需要準備報表，也不用先懂模型。
          </p>
        </div>

        <div class="lp-hero-visual">
          <ProductPreview />
        </div>
      </div>
    </section>

    <div class="lp-strip" aria-label="落子涵蓋的五個分析維度">
      <span class="lp-strip-label">一次分析，五個維度</span>
      <span v-for="capability in capabilities" :key="capability.label" class="lp-strip-item">
        <LandingIcon :name="capability.icon" :size="15" />
        {{ capability.label }}
      </span>
      <span class="lp-strip-note">一份可比較的判斷</span>
    </div>

    <!-- Why / problem -->
    <section id="why" class="lp-section lp-problem">
      <div class="lp-container">
        <div class="lp-section-head lp-section-head--split lp-reveal">
          <p class="lp-kicker">THE PROBLEM / 問題</p>
          <h2>選址，不該只靠直覺。</h2>
          <p class="lp-section-lede">
            資料不是沒有，而是散在不同地方。等商業、人口、人潮與交通湊齊，
            往往已經錯過最好的決定時機。
          </p>
        </div>

        <div class="lp-problem-grid">
          <article class="lp-problem-card lp-reveal">
            <span class="lp-problem-no">01</span>
            <h3>資料四散</h3>
            <p>店家、人口、人潮、交通，各自躺在不同報表與系統裡。</p>
            <small>整合成本高</small>
          </article>
          <article class="lp-problem-card lp-reveal">
            <span class="lp-problem-no">02</span>
            <h3>標準不一</h3>
            <p>這次看人流，下次看租金；換一個人做決定，判斷就變了。</p>
            <small>難以比較</small>
          </article>
          <article class="lp-problem-card lp-reveal">
            <span class="lp-problem-no">03</span>
            <h3>沒有下一步</h3>
            <p>數據很多，但沒有告訴你：哪個點值得先看、為什麼。</p>
            <small>決策斷層</small>
          </article>
        </div>

        <div class="lp-bridge lp-reveal">
          <div class="lp-bridge-mark" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <p class="lp-kicker">WHAT LUOZI DOES / 落子做的事</p>
            <h3>把一個座標，變成一張可以討論的區位判斷。</h3>
          </div>
          <p>
            一個座標進，五個維度出。最後得到一份 0–100 的綜合評分、
            數個可比較的候選生活圈，以及每個生活圈的完整數據。
          </p>
        </div>
      </div>
    </section>

    <!-- What you get -->
    <section id="what" class="lp-section lp-what">
      <div class="lp-container">
        <div class="lp-section-head lp-section-head--split lp-reveal">
          <p class="lp-kicker">WHAT YOU GET / 你會得到什麼</p>
          <h2>一個座標，五個答案。</h2>
          <p class="lp-section-lede">
            每個維度都對應一個更具體的經營問題，而不是多一張圖表。
          </p>
        </div>

        <div class="lp-what-grid">
          <article class="lp-what-card lp-reveal">
            <span class="lp-what-no">01</span>
            <span class="lp-what-icon"><LandingIcon name="store" :size="20" /></span>
            <h3>商業</h3>
            <p class="lp-what-q">附近有多少店？同業集中嗎？</p>
            <ul>
              <li>店家密度與產業結構</li>
              <li>HHI 集中度</li>
              <li>Shannon 多樣性</li>
            </ul>
          </article>
          <article class="lp-what-card lp-reveal">
            <span class="lp-what-no">02</span>
            <span class="lp-what-icon"><LandingIcon name="users" :size="20" /></span>
            <h3>人口</h3>
            <p class="lp-what-q">誰住在這裡？我的客群佔多少？</p>
            <ul>
              <li>總人口與戶數</li>
              <li>性別與年齡分布</li>
              <li>目標年齡層</li>
            </ul>
          </article>
          <article class="lp-what-card lp-reveal">
            <span class="lp-what-no">03</span>
            <span class="lp-what-icon"><LandingIcon name="pulse" :size="20" /></span>
            <h3>人潮</h3>
            <p class="lp-what-q">什麼時候人最多？穩定嗎？</p>
            <ul>
              <li>平日／假日六時段</li>
              <li>峰值與平均</li>
              <li>人潮穩定度</li>
            </ul>
          </article>
          <article class="lp-what-card lp-reveal">
            <span class="lp-what-no">04</span>
            <span class="lp-what-icon"><LandingIcon name="transit" :size="20" /></span>
            <h3>交通</h3>
            <p class="lp-what-q">人怎麼來？最後一哩多遠？</p>
            <ul>
              <li>捷運與公車場站</li>
              <li>路線數與密度</li>
              <li>最近場站距離</li>
            </ul>
          </article>
          <article class="lp-what-card lp-reveal">
            <span class="lp-what-no">05</span>
            <span class="lp-what-icon"><LandingIcon name="grid" :size="20" /></span>
            <h3>空間</h3>
            <p class="lp-what-q">哪些街區值得先看？</p>
            <ul>
              <li>格網熱區</li>
              <li>候選生活圈</li>
              <li>綜合評分與排序</li>
            </ul>
          </article>
        </div>

        <div class="lp-result lp-reveal">
          <span>你會得到</span>
          <p>一份 0–100 綜合評分 · 數個可比較的候選生活圈 · 每個生活圈的完整數據</p>
          <button type="button" @click="go('records')">看一份範例 <i aria-hidden="true">→</i></button>
        </div>
      </div>
    </section>

    <!-- Use cases -->
    <section id="uses" class="lp-section lp-uses">
      <div class="lp-container">
        <div class="lp-section-head lp-section-head--split lp-reveal">
          <p class="lp-kicker">WHO IT'S FOR / 適用場景</p>
          <h2>從選店，到找人。</h2>
          <p class="lp-section-lede">
            同一個座標，換一個問題，就能回答不同的商業決策。
          </p>
        </div>

        <div class="lp-usecase-grid">
          <article class="lp-usecase lp-usecase--lead lp-reveal">
            <div class="lp-usecase-top">
              <span class="lp-usecase-tag"><LandingIcon name="store" :size="16" /> 連鎖展店 / 餐飲創業</span>
              <b>01</b>
            </div>
            <h3>一次比較多個候選點，<br>把場勘留給值得的。</h3>
            <p>
              先用同一套指標篩掉明顯不適合的點，再深入少數幾個。
              減少無效場勘，也讓選點會議有共同的語言。
            </p>
            <div class="lp-outcomes">
              <span>降低無效場勘</span>
              <span>一致標準</span>
              <span>快速篩選</span>
            </div>
            <button class="lp-text-link" type="button" @click="go('create')">
              評估一個點 <i aria-hidden="true">→</i>
            </button>
          </article>

          <article class="lp-usecase lp-reveal">
            <div class="lp-usecase-top">
              <span class="lp-usecase-tag"><LandingIcon name="pulse" :size="16" /> 行銷與業務</span>
              <b>02</b>
            </div>
            <h3>找出人潮與客群<br>重疊的街區。</h3>
            <p>
              不開店，也能用。安排傳單、外送、業務拜訪的優先順序，
              把預算放在人多、也對的地方。
            </p>
            <div class="lp-outcomes">
              <span>時段人潮</span>
              <span>目標客群</span>
              <span>優先順序</span>
            </div>
            <button class="lp-text-link" type="button" @click="go('create')">
              找一個熱區 <i aria-hidden="true">→</i>
            </button>
          </article>

          <article class="lp-usecase lp-reveal">
            <div class="lp-usecase-top">
              <span class="lp-usecase-tag"><LandingIcon name="map" :size="16" /> 商圈研究與顧問</span>
              <b>03</b>
            </div>
            <h3>用同一套資料語言，<br>說明一個地點。</h3>
            <p>
              把機會與限制說清楚，讓報告、會議與客戶溝通更快聚焦。
              每一次分析都能留下紀錄，方便回頭比較。
            </p>
            <div class="lp-outcomes">
              <span>可溝通依據</span>
              <span>可重複分析</span>
              <span>分析紀錄</span>
            </div>
            <button class="lp-text-link" type="button" @click="go('records')">
              看分析紀錄 <i aria-hidden="true">→</i>
            </button>
          </article>
        </div>

        <div class="lp-audience lp-reveal">
          <span>也適合</span>
          <i>零售選品</i>
          <i>房地產顧問</i>
          <i>社區服務</i>
          <i>地方創生</i>
        </div>

        <p class="lp-roadmap lp-reveal">
          <i aria-hidden="true"></i>
          下一步：把歷次分析接上時間軸，觀察人口與人潮的變化。
        </p>
      </div>
    </section>

    <!-- Value band -->
    <section class="lp-value-band">
      <div class="lp-container lp-value-layout">
        <div class="lp-value-copy lp-reveal">
          <p class="lp-kicker lp-kicker--light">WHY IT WORKS / 為什麼值得</p>
          <h2>省下時間，<br>買到比較的能力。</h2>
        </div>
        <div class="lp-value-points">
          <article class="lp-reveal">
            <span>01</span>
            <h3>少做一次重工</h3>
            <p>不用再從四個來源拼一張表，也不用每次重新定義要看的指標。</p>
          </article>
          <article class="lp-reveal">
            <span>02</span>
            <h3>多一個共同語言</h3>
            <p>團隊用同一套五維指標討論，讓「我覺得」變成可以檢查的判斷。</p>
          </article>
          <article class="lp-reveal">
            <span>03</span>
            <h3>留下一次紀錄</h3>
            <p>每個分析都留在紀錄裡，下一次展店或拜訪可以從上次的結論開始。</p>
          </article>
          <p class="lp-value-note lp-reveal">
            一年只看一個點，這是一次研究；一年要看十個點，這是一套每天都能用的工作流。
          </p>
        </div>
      </div>
    </section>

    <!-- How -->
    <section id="how" class="lp-section lp-how">
      <div class="lp-container">
        <div class="lp-section-head lp-section-head--wide lp-reveal">
          <p class="lp-kicker">HOW IT WORKS / 怎麼用</p>
          <h2>三個步驟，<br>得到一份判斷。</h2>
        </div>

        <ol class="lp-steps">
          <li class="lp-step lp-reveal">
            <span class="lp-step-no">01</span>
            <div class="lp-step-visual" aria-hidden="true">
              <div class="step-map">
                <span class="step-map-ring"></span>
                <span class="step-map-pin"></span>
                <span class="step-map-label">25.0330°N · 121.5654°E</span>
              </div>
            </div>
            <h3>設定地點與範圍</h3>
            <p>地圖點選或輸入座標，選擇街道級、步行級或生活圈。</p>
            <small>輸入：一個座標</small>
          </li>
          <li class="lp-step lp-reveal">
            <span class="lp-step-no">02</span>
            <div class="lp-step-visual" aria-hidden="true">
              <div class="step-bars">
                <div><span>商業</span><i style="width: 94%"></i><b>94</b></div>
                <div><span>人口</span><i style="width: 89%"></i><b>89</b></div>
                <div><span>人潮</span><i style="width: 92%"></i><b>92</b></div>
                <div><span>交通</span><i style="width: 91%"></i><b>91</b></div>
              </div>
            </div>
            <h3>取得五維分析</h3>
            <p>系統計算商業、人口、人潮、交通與空間，整理成一個綜合評分。</p>
            <small>輸出：五個維度</small>
          </li>
          <li class="lp-step lp-reveal">
            <span class="lp-step-no">03</span>
            <div class="lp-step-visual" aria-hidden="true">
              <div class="step-areas">
                <div class="active"><span>生活圈 01</span><b>92</b></div>
                <div><span>生活圈 02</span><b>87</b></div>
                <div><span>生活圈 03</span><b>79</b></div>
              </div>
            </div>
            <h3>比較與決定</h3>
            <p>查看候選生活圈，把清單帶進場勘、會議或下一次展店決策。</p>
            <small>輸出：一份可比較的清單</small>
          </li>
        </ol>

        <blockquote class="lp-brand-note lp-reveal">
          「落子」是我們對選址決定的稱呼：先看清，再下決定。
          棋盤只是靈感，真正重要的是讓每一次決定都有依據。
        </blockquote>

        <div class="lp-how-actions lp-reveal">
          <button class="lp-btn lp-btn--primary" type="button" @click="go('create')">
            開始分析 <span class="lp-arrow" aria-hidden="true">→</span>
          </button>
          <span>不用先準備資料。</span>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="lp-section lp-faq">
      <div class="lp-container lp-faq-layout">
        <div class="lp-faq-intro lp-reveal">
          <p class="lp-kicker">FAQ / 常見問題</p>
          <h2>開始之前，<br>你可能想知道。</h2>
          <p>如果這裡沒有你要的答案，直接建立一筆分析看看最快。</p>
          <button class="lp-btn lp-btn--primary" type="button" @click="go('create')">
            開始分析 <span class="lp-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div class="lp-faq-list">
          <details
            v-for="(faq, index) in faqs"
            :key="faq.question"
            class="lp-faq-item lp-reveal"
            :open="index === 0"
          >
            <summary>
              <span>{{ faq.question }}</span>
              <i aria-hidden="true"></i>
            </summary>
            <p>{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="lp-cta">
      <div class="lp-cta-inner">
        <div class="lp-cta-visual lp-reveal" aria-hidden="true">
          <div class="cta-stack">
            <div class="cta-stack-card cta-stack-card--back">
              <span>5 個生活圈</span>
              <strong>可比較</strong>
              <small>同一套五維標準</small>
            </div>
            <div class="cta-stack-card cta-stack-card--mid">
              <span>生活圈 02</span>
              <strong>87</strong>
              <small>綜合評分</small>
            </div>
            <div class="cta-stack-card cta-stack-card--front">
              <span class="cta-stack-tag">首選</span>
              <span>生活圈 01</span>
              <strong>92</strong>
              <div class="cta-stack-metrics">
                <span>商業 94</span><span>人口 89</span><span>人潮 92</span><span>交通 91</span>
              </div>
              <small>查看完整分析 →</small>
            </div>
          </div>
        </div>
        <div class="lp-cta-copy lp-reveal">
          <p class="lp-kicker lp-kicker--light">YOUR NEXT MOVE / 下一步</p>
          <h2>從一個<br>座標開始。</h2>
          <p>先看一個點，再決定下一個點。第一次分析，不需要設定，也不需要準備報表。</p>
          <div class="lp-actions">
            <button class="lp-btn lp-btn--primary" type="button" @click="go('create')">
              開始分析 <span class="lp-arrow" aria-hidden="true">→</span>
            </button>
            <button class="lp-btn lp-btn--ghost" type="button" @click="go('records')">
              翻開分析紀錄
            </button>
          </div>
        </div>
      </div>
    </section>

    <footer class="lp-footer">
      <div class="lp-footer-inner">
        <div class="lp-footer-brand">
          <BrandMark :size="30" />
          <div>
            <strong>落子 luozi</strong>
            <span>Decision Platform</span>
          </div>
        </div>

        <div class="lp-footer-links">
          <button type="button" @click="scrollToSection('why')">為什麼</button>
          <button type="button" @click="scrollToSection('what')">功能</button>
          <button type="button" @click="scrollToSection('uses')">適用場景</button>
          <button type="button" @click="scrollToSection('how')">怎麼用</button>
          <button type="button" @click="scrollToSection('faq')">常見問題</button>
          <button type="button" @click="go('create')">開始分析</button>
          <button type="button" @click="go('records')">分析紀錄</button>
        </div>

        <p class="lp-footer-note">先看清，再決定。<br><span>© 2026 luozi · for better location decisions.</span></p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.lp {
  --lp-pad: clamp(20px, 5vw, 68px);
  position: relative;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
}

.lp-container {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-right: var(--lp-pad);
  padding-left: var(--lp-pad);
}

/* Hero ------------------------------------------------------------------ */
.lp-hero {
  position: relative;
  min-height: max(760px, 100vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 28%, rgba(195, 71, 44, 0.08), transparent 30%),
    radial-gradient(circle at 18% 88%, rgba(217, 183, 124, 0.2), transparent 32%),
    var(--paper);
  color: var(--ink);
  border-bottom: 1px solid var(--line);
}

.lp-hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(20, 21, 15, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 21, 15, 0.045) 1px, transparent 1px);
  background-size: 76px 76px;
  mask-image: linear-gradient(to bottom, black, transparent 88%);
  pointer-events: none;
}

.lp-orbit {
  position: absolute;
  border: 1px dashed rgba(195, 71, 44, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.lp-orbit--a {
  top: 12%;
  right: -12%;
  width: 58vw;
  height: 58vw;
}

.lp-orbit--b {
  right: 4%;
  bottom: -22%;
  width: 42vw;
  height: 42vw;
  border-color: rgba(20, 21, 15, 0.07);
}

.lp-orbit--c {
  top: 26%;
  left: -16%;
  width: 32vw;
  height: 32vw;
  border-color: rgba(195, 71, 44, 0.14);
}

.lp-nav {
  position: relative;
  z-index: 5;
  width: min(100%, 1440px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 26px var(--lp-pad);
}

.lp-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}

.lp-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lp-brand-name {
  display: flex;
  align-items: baseline;
  gap: 9px;
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1;
}

.lp-brand-name small {
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.lp-brand-sub {
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.lp-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lp-nav-links button {
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  transition: color 0.18s ease;
}

.lp-nav-links button:hover {
  color: var(--ink);
}

.lp-nav-cta {
  min-height: 38px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border: 1px solid var(--vermilion);
  background: var(--vermilion);
  color: #fff8ea;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.lp-nav-cta:hover {
  border-color: var(--vermilion-2);
  background: var(--vermilion-2);
  color: #fff8ea;
}

.lp-nav-cta span {
  font-family: var(--font-mono);
}

.lp-hero-inner {
  position: relative;
  z-index: 2;
  width: min(100%, 1440px);
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(30px, 5vw, 84px);
  margin: 0 auto;
  padding: 34px var(--lp-pad) 48px;
}

.lp-hero-copy {
  max-width: 680px;
}

.lp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.18em;
}

.lp-eyebrow span {
  width: 22px;
  height: 1px;
  background: var(--vermilion);
}

.lp-hero h1 {
  margin: 22px 0 24px;
  font-family: var(--font-display);
  font-size: clamp(44px, 5.4vw, 76px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.04;
  text-wrap: balance;
}

.lp-hero h1 span {
  color: var(--vermilion);
}

.lp-lede {
  max-width: 540px;
  color: var(--muted);
  font-size: 14.5px;
  line-height: 1.9;
}

.lp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.lp-btn {
  min-height: 48px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 22px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.lp-btn:hover {
  transform: translateY(-2px);
}

.lp-btn--primary {
  border-color: var(--vermilion);
  background: var(--vermilion);
  color: #fff8ea;
  box-shadow: 0 18px 40px -24px rgba(195, 71, 44, 0.9);
}

.lp-btn--primary:hover {
  border-color: #d65537;
  background: #d65537;
}

.lp-btn--ghost {
  border-color: var(--line-strong);
  color: var(--ink);
}

.lp-btn--ghost:hover {
  border-color: var(--ink);
  background: rgba(20, 21, 15, 0.04);
}

.lp-arrow {
  font-family: var(--font-mono);
  transition: transform 0.18s ease;
}
.lp-hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 20px;
  margin-top: 28px;
  padding: 0;
  list-style: none;
}

.lp-hero-points li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-2);
  font-size: 10.5px;
  letter-spacing: 0.01em;
}

.lp-hero-points svg {
  color: var(--vermilion);
}

.lp-hero-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  color: var(--muted);
  font-size: 9.5px;
}

.lp-hero-note svg {
  color: var(--muted-2);
}


.lp-btn:hover .lp-arrow {
  transform: translateX(3px);
}

.lp-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 48px;
  padding-top: 18px;
  border-top: 1px solid rgba(246, 241, 230, 0.13);
}

.lp-meta div {
  padding-right: 18px;
  border-right: 1px solid rgba(246, 241, 230, 0.1);
}

.lp-meta div:last-child {
  border-right: 0;
}

.lp-meta dt {
  color: rgba(246, 241, 230, 0.36);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.14em;
}

.lp-meta dd {
  margin-top: 5px;
  color: rgba(246, 241, 230, 0.76);
  font-size: 10.5px;
  letter-spacing: 0.03em;
}

.lp-hero-visual {
  position: relative;
  min-width: 0;
  width: min(100%, 640px);
  justify-self: end;
  padding: 10px 0;
}

.lp-hero-foot {
  position: relative;
  z-index: 2;
  width: min(100%, 1440px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding: 0 var(--lp-pad) 26px;
  color: rgba(246, 241, 230, 0.3);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.12em;
}

/* Strip ----------------------------------------------------------------- */
.lp-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 22px;
  padding: 13px var(--lp-pad);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: var(--paper-2);
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8.5px;
  letter-spacing: 0.08em;
}

.lp-strip-label {
  color: var(--ink-2);
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.lp-strip-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-2);
}

.lp-strip-item svg {
  color: var(--vermilion);
}

.lp-strip-note {
  color: var(--muted-2);
}

/* Shared section -------------------------------------------------------- */
.lp-section {
  position: relative;
  padding: clamp(72px, 9vw, 120px) 0;
}

.lp-section-head {
  margin-bottom: clamp(34px, 5vw, 58px);
}

.lp-section-head--split {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  align-items: end;
  gap: 30px;
}

.lp-section-head--wide {
  display: block;
}

.lp-kicker {
  grid-column: 1 / -1;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.lp-section-head h2 {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: clamp(34px, 4.2vw, 56px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.1;
  text-wrap: balance;
}

.lp-section-lede {
  max-width: 430px;
  justify-self: end;
  padding-bottom: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.95;
}

.lp-body {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.95;
}

.lp-kicker--light {
  color: var(--muted);
}

.lp-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.lp-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Problem --------------------------------------------------------------- */
.lp-problem-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--line-strong);
}

.lp-problem-card {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  padding: 22px 24px 24px 0;
  border-right: 1px solid var(--line);
}

.lp-problem-card:last-child {
  border-right: 0;
}

.lp-problem-card:not(:first-child) {
  padding-left: 24px;
}

.lp-problem-no {
  color: var(--vermilion);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.12em;
}

.lp-problem-card h3 {
  margin-top: 34px;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0;
}

.lp-problem-card p {
  max-width: 300px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.85;
}

.lp-problem-card small {
  margin-top: auto;
  padding-top: 18px;
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.lp-bridge {
  border-radius: 14px;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(0, 0.9fr);
  align-items: center;
  gap: 24px;
  margin-top: 46px;
  padding: 24px;
  border: 1px solid var(--line);
  background: var(--card);
}

.lp-bridge-mark {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
}

.lp-bridge-mark span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--vermilion);
  box-shadow: 0 0 0 7px rgba(195, 71, 44, 0.1);
}

.lp-bridge h3 {
  margin-top: 5px;
  font-family: var(--font-display);
  font-size: clamp(20px, 2.2vw, 26px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
}

.lp-bridge > p {
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.9;
}

/* What you get ---------------------------------------------------------- */
.lp-what {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(circle at 82% 20%, rgba(217, 183, 124, 0.18), transparent 36%),
    var(--paper-2);
}

.lp-what-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.lp-what-card {
  position: relative;
  min-height: 310px;
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--card);
  transition: background 0.2s ease;
}

.lp-what-card:hover {
  background: var(--card);
}

.lp-what-no {
  color: var(--vermilion);
  font-family: var(--font-sans);
  font-size: 8.5px;
  letter-spacing: 0.12em;
}

.lp-what-icon {
  position: absolute;
  top: 18px;
  right: 16px;
  display: inline-flex;
  color: var(--vermilion);
  opacity: 0.72;
}

.lp-what-card h3 {
  margin-top: 26px;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.lp-what-q {
  min-height: 46px;
  margin-top: 8px;
  color: var(--ink-2);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.7;
}

.lp-what-card ul {
  margin: auto 0 0;
  padding: 16px 0 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.lp-what-card li {
  padding: 3px 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.lp-what-card li::before {
  content: "—";
  margin-right: 6px;
  color: var(--gold);
}

.lp-result {
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid var(--line-strong);
  background: var(--paper-2);
  color: var(--ink);
}

.lp-result > span {
  flex: 0 0 auto;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.16em;
}

.lp-result p {
  flex: 1;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.45;
}

.lp-result button {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--vermilion-2);
  cursor: pointer;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.lp-result button i {
  margin-left: 7px;
  font-family: var(--font-mono);
  font-style: normal;
}

/* Use cases ------------------------------------------------------------- */
.lp-usecase-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.lp-usecase {
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  padding: 26px;
  border: 1px solid var(--line);
  background: var(--card);
}

.lp-usecase--lead {
  border-color: var(--vermilion-2);
  background: var(--vermilion-2);
  color: #fff8ea;
}

.lp-usecase-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.lp-usecase-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.lp-usecase-tag svg {
  color: var(--vermilion);
}

.lp-usecase--lead .lp-usecase-tag svg {
  color: #f2d29b;
}

.lp-usecase--lead .lp-usecase-top {
  color: rgba(255, 248, 234, 0.68);
}

.lp-usecase-top b {
  color: var(--muted-2);
  font-weight: 400;
}

.lp-usecase--lead .lp-usecase-top b {
  color: rgba(255, 248, 234, 0.45);
}

.lp-usecase h3 {
  margin-top: 40px;
  font-family: var(--font-display);
  font-size: clamp(24px, 2.4vw, 32px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.28;
  text-wrap: balance;
}

.lp-usecase p {
  margin-top: 14px;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.9;
}

.lp-usecase--lead p {
  color: rgba(255, 248, 234, 0.78);
}

.lp-outcomes {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 20px;
}

.lp-outcomes span {
  padding: 4px 7px;
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 8.5px;
  letter-spacing: 0.04em;
}

.lp-usecase--lead .lp-outcomes span {
  border-color: rgba(255, 248, 234, 0.28);
  color: rgba(255, 248, 234, 0.78);
}

.lp-text-link {
  align-self: flex-start;
  margin-top: auto;
  padding: 18px 0 0;
  border: 0;
  background: transparent;
  color: var(--vermilion-2);
  cursor: pointer;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.lp-usecase--lead .lp-text-link {
  color: #fff8ea;
}

.lp-text-link i {
  margin-left: 7px;
  font-family: var(--font-mono);
  font-style: normal;
  transition: margin 0.18s ease;
}

.lp-text-link:hover i {
  margin-left: 12px;
}

.lp-audience {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
}

.lp-audience > span {
  margin-right: 6px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8.5px;
  letter-spacing: 0.12em;
}

.lp-audience i {
  padding: 5px 9px;
  border: 1px solid var(--line);
  color: var(--ink-2);
  font-size: 9px;
  font-style: normal;
  letter-spacing: 0.04em;
}

.lp-roadmap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 9.5px;
}

.lp-roadmap i {
  width: 4px;
  height: 4px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--vermilion);
}

/* Value band ------------------------------------------------------------ */
.lp-value-band {
  padding: clamp(64px, 8vw, 104px) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(circle at 22% 30%, rgba(195, 71, 44, 0.07), transparent 32%),
    var(--paper-2);
  color: var(--ink);
}

.lp-value-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(36px, 7vw, 100px);
  align-items: start;
}

.lp-value-copy h2 {
  margin-top: 14px;
  font-family: var(--font-display);
  font-size: clamp(30px, 3.2vw, 46px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.18;
  text-wrap: balance;
}

.lp-value-points {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--line-strong);
}

.lp-value-points article {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 2px 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

.lp-value-points span {
  grid-row: span 2;
  color: var(--vermilion);
  font-family: var(--font-sans);
  font-size: 8.5px;
  letter-spacing: 0.1em;
}

.lp-value-points h3 {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0;
}

.lp-value-points p {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.8;
}

.lp-value-note {
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.03em;
  line-height: 1.8;
}

/* How ------------------------------------------------------------------- */
.lp-how {
  background: var(--paper-2);
  border-bottom: 1px solid var(--line);
}

.lp-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
  list-style: none;
}

.lp-step {
  position: relative;
  padding: 22px 24px 10px 0;
  border-right: 1px solid var(--line);
}

.lp-step:last-child {
  border-right: 0;
}

.lp-step:not(:first-child) {
  padding-left: 24px;
}

.lp-step::before {
  content: "";
  position: absolute;
  top: -3px;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vermilion);
}

.lp-step:not(:first-child)::before {
  left: 24px;
}

.lp-step-no {
  color: var(--vermilion);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.12em;
}

.lp-step-visual {
  border-radius: 14px;
  position: relative;
  height: 148px;
  display: grid;
  place-items: center;
  margin: 14px 0 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: rgba(252, 249, 241, 0.58);
}

.step-map {
  position: relative;
  width: 78%;
  height: 100%;
  background-image:
    linear-gradient(rgba(20, 21, 15, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 21, 15, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}

.step-map-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 74px;
  height: 74px;
  border: 1px dashed rgba(195, 71, 44, 0.55);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.step-map-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  border: 2px solid var(--card);
  border-radius: 50%;
  background: var(--vermilion);
  box-shadow: 0 0 0 1px var(--vermilion);
  transform: translate(-50%, -50%);
}

.step-map-label {
  position: absolute;
  left: 0;
  bottom: 0;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 7px;
  letter-spacing: 0.02em;
}

.step-bars {
  width: 76%;
  display: grid;
  gap: 9px;
}

.step-bars > div {
  display: grid;
  grid-template-columns: 32px 1fr 22px;
  align-items: center;
  gap: 8px;
}

.step-bars span {
  color: var(--muted);
  font-size: 8px;
}

.step-bars i {
  display: block;
  height: 3px;
  background: var(--vermilion);
}

.step-bars b {
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 500;
  text-align: right;
}

.step-areas {
  width: 78%;
  display: grid;
  gap: 4px;
}

.step-areas > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 7.5px;
}

.step-areas b {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.step-areas > div.active {
  border-color: var(--vermilion-2);
  background: var(--vermilion-2);
  color: rgba(255, 248, 234, 0.7);
}

.step-areas > div.active b {
  color: #fff8ea;
}

.step-areas > div:nth-child(2) b {
  color: var(--ink-2);
}

.lp-step h3 {
  margin-top: 18px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0;
}

.lp-step p {
  max-width: 320px;
  margin-top: 9px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.85;
}

.lp-step small {
  display: block;
  margin-top: 18px;
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 8.5px;
  letter-spacing: 0.06em;
}

.lp-brand-note {
  max-width: 850px;
  margin: 46px 0 0;
  padding: 20px 0 20px 24px;
  border-left: 2px solid var(--vermilion);
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 15.5px;
  letter-spacing: 0;
  line-height: 1.9;
}

.lp-how-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 28px;
}

.lp-how-actions > span {
  color: var(--muted);
  font-size: 10px;
}

/* FAQ ------------------------------------------------------------------- */
.lp-faq {
  background: var(--paper);
}

.lp-faq-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: start;
  gap: clamp(36px, 6vw, 76px);
}

.lp-faq-intro h2 {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 48px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.12;
  text-wrap: balance;
}

.lp-faq-intro > p:not(.lp-kicker) {
  max-width: 360px;
  margin-top: 16px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.9;
}

.lp-faq-intro .lp-btn {
  margin-top: 24px;
}

.lp-faq-list {
  border-top: 1px solid var(--line-strong);
}

.lp-faq-item {
  border-bottom: 1px solid var(--line);
}

.lp-faq-item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 0;
  color: var(--ink);
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  list-style: none;
}

.lp-faq-item summary::-webkit-details-marker {
  display: none;
}

.lp-faq-item summary i {
  position: relative;
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
}

.lp-faq-item summary i::before,
.lp-faq-item summary i::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 1px;
  background: var(--ink-2);
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.lp-faq-item summary i::after {
  transform: rotate(90deg);
}

.lp-faq-item[open] summary i::after {
  opacity: 0;
  transform: rotate(0deg);
}

.lp-faq-item p {
  max-width: 640px;
  padding: 0 30px 20px 0;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.9;
}

/* CTA ------------------------------------------------------------------- */
.lp-cta {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(circle at 18% 42%, rgba(195, 71, 44, 0.07), transparent 34%),
    var(--paper);
  color: var(--ink);
}

.lp-cta-inner {
  width: min(100%, 1200px);
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(30px, 7vw, 90px);
  margin: 0 auto;
  padding: clamp(64px, 8vw, 108px) var(--lp-pad);
}

.lp-cta-visual {
  min-width: 0;
  width: min(100%, 440px);
  justify-self: center;
}

.cta-stack {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 0.95;
  min-height: 360px;
}

.cta-stack::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 78%;
  height: 78%;
  border: 1px dashed rgba(195, 71, 44, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cta-stack-card {
  border-radius: 14px;
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--line);
  background: var(--card);
  box-shadow: 0 24px 50px -30px rgba(20, 21, 15, 0.45);
}

.cta-stack-card span {
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.cta-stack-card strong {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
}

.cta-stack-card small {
  color: var(--muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.cta-stack-card--back {
  top: 14%;
  left: 4%;
  width: 56%;
  padding: 18px;
  transform: rotate(-7deg);
}

.cta-stack-card--back strong {
  color: var(--ink-2);
  font-size: 27px;
}

.cta-stack-card--mid {
  top: 34%;
  right: 2%;
  width: 46%;
  padding: 16px;
  transform: rotate(5deg);
}

.cta-stack-card--mid strong {
  color: var(--jade);
}

.cta-stack-card--front {
  bottom: 3%;
  left: 14%;
  width: 68%;
  padding: 20px;
  border-color: var(--vermilion-2);
  transform: rotate(-2deg);
}

.cta-stack-card--front strong {
  color: var(--vermilion-2);
  font-size: 54px;
}

.cta-stack-tag {
  align-self: flex-start;
  padding: 2px 6px;
  border: 1px solid rgba(195, 71, 44, 0.3);
  color: var(--vermilion-2) !important;
  font-family: var(--font-sans) !important;
  font-size: 8px !important;
  font-weight: 700;
}

.cta-stack-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
  margin-top: 4px;
}

.cta-stack-metrics span {
  color: var(--ink-2);
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0;
}

.cta-stack-card--front small {
  margin-top: auto;
  color: var(--vermilion-2);
  font-weight: 700;
}

.lp-cta-copy h2 {
  margin-top: 16px;
  font-family: var(--font-display);
  font-size: clamp(44px, 5.6vw, 72px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.04;
  text-wrap: balance;
}

.lp-cta-copy > p:not(.lp-kicker) {
  max-width: 380px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.9;
}

/* Footer ---------------------------------------------------------------- */
.lp-footer {
  background: var(--paper);
  color: var(--ink);
  border-top: 1px solid var(--line);
}

.lp-footer-inner {
  width: min(100%, 1320px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 30px;
  margin: 0 auto;
  padding: 34px var(--lp-pad);
}

.lp-footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lp-footer-brand strong {
  display: block;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.lp-footer-brand span {
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 7.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.lp-footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

.lp-footer-links button {
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  transition: color 0.18s ease;
}

.lp-footer-links button:hover {
  color: var(--ink);
}

.lp-footer-note {
  justify-self: end;
  color: var(--ink-2);
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.06em;
  line-height: 1.7;
  text-align: right;
}

.lp-footer-note span {
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 7.5px;
  letter-spacing: 0.08em;
}

/* Responsive ------------------------------------------------------------ */
@media (max-width: 1180px) {
  .lp-hero-inner {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 30px;
  }

  .lp-what-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .lp-what-card {
    padding: 18px 14px;
  }

  .lp-usecase h3 {
    font-size: 29px;
  }
}

@media (max-width: 960px) {
  .lp-hero {
    min-height: 0;
  }

  .lp-hero-inner {
    grid-template-columns: 1fr;
    gap: 44px;
    padding-top: 38px;
    padding-bottom: 40px;
  }

  .lp-hero-copy {
    max-width: 680px;
  }

  .lp-hero-visual {
    width: min(100%, 560px);
    justify-self: center;
  }

  .lp-nav-links {
    display: none;
  }

  .lp-section-head--split {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .lp-section-lede {
    grid-column: auto;
    justify-self: start;
    max-width: 560px;
  }

  .lp-problem-grid {
    grid-template-columns: 1fr;
    border-top: 0;
  }

  .lp-problem-card,
  .lp-problem-card:not(:first-child) {
    min-height: 0;
    padding: 20px 0;
    border-right: 0;
    border-top: 1px solid var(--line);
  }

  .lp-problem-card h3 {
    margin-top: 18px;
  }

  .lp-problem-card small {
    margin-top: 12px;
  }

  .lp-bridge {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 16px;
  }

  .lp-bridge > p {
    grid-column: 2;
  }

  .lp-what-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lp-what-card {
    min-height: 260px;
  }

  .lp-result {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .lp-usecase-grid {
    grid-template-columns: 1fr;
  }

  .lp-usecase {
    min-height: 0;
  }

  .lp-usecase h3 {
    margin-top: 26px;
  }

  .lp-value-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }


  .lp-steps {
    grid-template-columns: 1fr;
  }

  .lp-step,
  .lp-step:not(:first-child) {
    padding: 22px 0;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .lp-step:last-child {
    border-bottom: 0;
  }

  .lp-step::before,
  .lp-step:not(:first-child)::before {
    left: 0;
  }

  .lp-faq-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .lp-cta-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .lp-cta-visual {
    width: min(100%, 430px);
    justify-self: start;
  }

  .lp-footer-inner {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 20px;
  }

  .lp-footer-links {
    justify-content: flex-start;
  }

  .lp-footer-note {
    justify-self: start;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .lp-nav {
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .lp-hero h1 {
    font-size: clamp(43px, 12.6vw, 62px);
  }

  .lp-lede {
    font-size: 12.5px;
    line-height: 1.9;
  }

  .lp-meta {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-top: 32px;
  }

  .lp-meta div {
    padding: 0 0 10px;
    border-right: 0;
    border-bottom: 1px solid rgba(246, 241, 230, 0.09);
  }

  .lp-meta div:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .lp-hero-foot {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .lp-hero-foot span:last-child {
    display: none;
  }

  .lp-hero-visual {
    padding: 4px 0;
  }

  .lp-section-head h2 {
    font-size: clamp(34px, 9.4vw, 48px);
  }

  .lp-problem-card h3 {
    font-size: 26px;
  }

  .lp-bridge {
    grid-template-columns: 1fr;
  }

  .lp-bridge-mark {
    width: 42px;
    height: 42px;
  }

  .lp-bridge > p {
    grid-column: auto;
  }

  .lp-what-grid {
    grid-template-columns: 1fr;
  }

  .lp-what-card {
    min-height: 0;
    display: block;
  }

  .lp-what-card h3 {
    margin-top: 18px;
  }

  .lp-what-q {
    min-height: 0;
  }

  .lp-what-card ul {
    margin-top: 16px;
  }

  .lp-result p {
    font-size: 16px;
  }

  .lp-usecase {
    padding: 22px;
  }

  .lp-usecase h3 {
    font-size: 26px;
  }

  .lp-value-copy h2 {
    font-size: clamp(30px, 8.4vw, 44px);
    line-height: 1.18;
  }

  .lp-brand-note {
    margin-top: 32px;
    font-size: 15px;
  }

  .lp-faq-item summary {
    font-size: 15px;
  }

  .lp-faq-item p {
    padding-right: 0;
  }

  .lp-cta-copy h2 {
    font-size: clamp(48px, 13vw, 68px);
  }

  .lp-cta-visual {
    width: 100%;
  }

  .lp-footer-links {
    gap: 0;
  }

  .lp-strip {
    justify-content: flex-start;
  }
}
</style>
