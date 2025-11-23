// app.js — Full Simplified Dark YummyExam Clone
const API = 'https://www.themealdb.com/api/json/v1/1/';

document.addEventListener('DOMContentLoaded', () => {

  // --- references ---
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const overlay = document.getElementById('overlay');
  const main = document.getElementById('main');
  const menuList = document.getElementById('menuList');
  const controlsArea = document.getElementById('controlsArea');
  const mealsGrid = document.getElementById('mealsGrid');
  const mealModalEl = document.getElementById('mealModal');
  const mealModal = new bootstrap.Modal(mealModalEl);

  // --- helpers ---
  function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
  function clearMeals(){ mealsGrid.innerHTML=''; }
  function clearControls(){ controlsArea.innerHTML=''; }
  function limit20(arr){ return Array.isArray(arr)? arr.slice(0,20) : []; }

  function escapeHtml(str){
    if(!str) return '';
    return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
  }

  function showSpinner(targetEl){
    clearMeals();
    const s = el('div','col-12 d-flex justify-content-center align-items-center py-5');
    s.id='loadingSpinner';
    s.innerHTML = `<div class="spinner-border text-light" role="status"></div>`;
    targetEl.appendChild(s);
  }

  function hideSpinner(){ const s=document.getElementById('loadingSpinner'); if(s) s.remove(); }

  async function fetchJSON(url){
    try{ const res = await fetch(url); if(!res.ok) throw new Error('Network error'); return await res.json(); }
    catch(e){ console.error('fetchJSON error', e); return null; }
  }

  // --- sidebar ---
  function openSidebar(){
    sidebar.classList.add('open'); overlay.classList.add('show'); main.classList.add('blur');
    hamburger?.setAttribute('aria-expanded','true');
    document.body.classList.add('sidebar-open');
    Array.from(sidebar.querySelectorAll('.menu-item')).forEach((it,i)=>{
      it.style.transitionDelay=`${i*100}ms`; it.classList.add('show');
    });
    sidebar.querySelector('.menu-link')?.focus();
  }

  function closeSidebar(){
    sidebar.classList.remove('open'); overlay.classList.remove('show'); main.classList.remove('blur');
    hamburger?.setAttribute('aria-expanded','false'); document.body.classList.remove('sidebar-open');
    Array.from(sidebar.querySelectorAll('.menu-item')).forEach(it=>{ it.classList.remove('show'); it.style.transitionDelay=''; });
    hamburger.focus();
  }

  hamburger.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeSidebar(); });

  // --- render meals ---
  function renderMeals(meals){
    clearMeals(); hideSpinner();
    if(!meals || meals.length===0){ mealsGrid.innerHTML='<div class="col-12 text-muted">No results.</div>'; return; }
    const frag = document.createDocumentFragment();
    limit20(meals).forEach(m=>{
      const col = el('div','col-6 col-md-3');
      const card = el('div','card meal-card');
      card.setAttribute('role','button'); card.setAttribute('tabindex','0'); card.setAttribute('aria-label', `Open ${m.strMeal}`);

      const img = el('img','img-fluid rounded');
      img.src=m.strMealThumb||''; img.alt=m.strMeal||'Meal';
      img.loading='lazy'; img.decoding='async'; img.style.height='170px'; img.style.objectFit='cover';

      const overlayDiv = el('div','meal-overlay'); overlayDiv.innerHTML=`<div class="card-meal-title p-2">${escapeHtml(m.strMeal)}</div>`;

      card.append(img, overlayDiv);
      card.addEventListener('click', ()=>showMealDetails(m.idMeal));
      card.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'||ev.key===' ') showMealDetails(m.idMeal); });

      col.appendChild(card); frag.appendChild(col);
    });
    mealsGrid.appendChild(frag);
  }

  async function showMealDetails(id){
    showSpinner(mealsGrid);
    const d = await fetchJSON(API+'lookup.php?i='+encodeURIComponent(id));
    hideSpinner();
    const m = d?.meals?.[0]; if(!m) return;

    document.getElementById('mealModalLabel').textContent = m.strMeal||'-';
    const imgEl=document.getElementById('mealImg'); imgEl.src=m.strMealThumb||''; imgEl.alt=m.strMeal||'Meal image';
    document.getElementById('mealCategory').textContent=m.strCategory||'-';
    document.getElementById('mealArea').textContent=m.strArea||'-';

    const tagsEl=document.getElementById('mealTags'); tagsEl.innerHTML='';
    m.strTags?.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>{
      const b=el('span','badge bg-secondary me-1 mb-1'); b.textContent=t; tagsEl.appendChild(b);
    }) || (tagsEl.textContent='-');

    document.getElementById('mealInstructions').textContent=m.strInstructions||'-';

    // ingredients
    const ingList=document.getElementById('mealIngredientsList'); ingList.innerHTML='';
    for(let i=1;i<=20;i++){
      const ing=m['strIngredient'+i]; const meas=m['strMeasure'+i];
      if(ing?.trim()){
        const span=el('span','recipe-pill'); span.textContent=(meas?meas.trim()+' - ':'')+ing.trim(); ingList.appendChild(span);
      }
    }
    if(!ingList.childElementCount) ingList.textContent='-';

    // links
    const sourceEl=document.getElementById('mealSource'); sourceEl.innerHTML = m.strSource ? `<a class="btn btn-sm btn-success me-2" href="${escapeHtml(m.strSource)}" target="_blank">Source</a>` : '-';
    const ytEl=document.getElementById('mealYoutube'); ytEl.innerHTML = m.strYoutube ? `<a class="btn btn-sm btn-danger" href="${escapeHtml(m.strYoutube)}" target="_blank">YouTube</a>` : '-';

    mealModal.show();
  }

  // --- last search ---
  function saveLastSearch(q){ try{ localStorage.setItem('yummy_last_search', q||''); }catch(e){} }
  function getLastSearch(){ try{ return localStorage.getItem('yummy_last_search')||''; }catch(e){ return ''; } }

  // --- menu actions ---
  async function actionSearch(){
    clearControls();
    const row = el('div','row g-2 align-items-center');
    row.innerHTML=`
      <div class="col-md-6"><input id="searchName" class="form-control" placeholder="Search By Name"></div>
      <div class="col-md-6"><input id="searchLetter" maxlength="1" class="form-control" placeholder="Search By First Letter"></div>
    `;
    controlsArea.appendChild(row);

    const last=getLastSearch(); if(last) document.getElementById('searchName').value=last;

    document.getElementById('searchName').addEventListener('keydown', async e=>{
      if(e.key!=='Enter') return;
      const q=e.target.value.trim(); showSpinner(mealsGrid);
      const d = await fetchJSON(API+'search.php?s='+encodeURIComponent(q));
      renderMeals(d?.meals||[]); saveLastSearch(q);
    });

    document.getElementById('searchLetter').addEventListener('keydown', async e=>{
      if(e.key!=='Enter') return; const q=e.target.value.trim(); if(!q){ alert('Enter letter'); return; }
      showSpinner(mealsGrid); const d=await fetchJSON(API+'search.php?f='+encodeURIComponent(q));
      renderMeals(d?.meals||[]); saveLastSearch('');
    });
  }

  async function actionCategories(){
    clearControls(); clearMeals(); controlsArea.innerHTML='<p class="text-muted">Loading categories...</p>';
    const d=await fetchJSON(API+'categories.php'); clearControls();
    if(!d?.categories){ controlsArea.innerHTML='<p class="text-muted">No categories.</p>'; return; }

    const grid=el('div','categories-grid');
    d.categories.forEach(cat=>{
      const col=el('div','category-card');
      const wrap=el('div','cat-wrap'); wrap.setAttribute('role','button'); wrap.setAttribute('tabindex','0'); wrap.setAttribute('aria-label',`Open ${cat.strCategory}`);

      const img=el('img','cat-img'); img.src=cat.strCategoryThumb||''; img.alt=cat.strCategory||'category'; img.loading='lazy';
      const overlay=el('div','cat-overlay'); overlay.innerHTML=`<div class="cat-overlay-text">${escapeHtml(cat.strCategory)}</div>`;
      wrap.append(img, overlay); col.appendChild(wrap);
      const title=el('div','cat-title'); title.textContent=cat.strCategory; col.appendChild(title);

      const openCategory=async ()=>{
        showSpinner(mealsGrid);
        const r=await fetchJSON(API+'filter.php?c='+encodeURIComponent(cat.strCategory));
        renderMeals(r?.meals||[]); try{ closeSidebar(); }catch(e){}
      };
      wrap.addEventListener('click', openCategory);
      wrap.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'||ev.key===' ') openCategory(); });
      grid.appendChild(col);
    });

    controlsArea.appendChild(grid);
  }

  // --- Updated actionArea ---
  async function actionArea(){
    clearControls(); clearMeals(); controlsArea.innerHTML='<p class="text-muted">Loading areas...</p>';
    const d=await fetchJSON(API+'list.php?a=list'); clearControls();
    if(!d?.meals){ controlsArea.innerHTML='<p class="text-muted">No areas.</p>'; return; }

    const grid=el('div','areas-grid');
    d.meals.forEach(a=>{
      const card=el('div','area-card'); 
      card.setAttribute('role','button'); 
      card.setAttribute('tabindex','0'); 
      card.setAttribute('aria-label',`Filter by ${a.strArea}`);

      const iconWrap=el('div','area-icon');
      const slug=a.strArea.toLowerCase().replace(/[^a-z0-9]+/g,'-'); 
      const img=el('img','area-img');
      img.src=`./imges/areas/${slug}.png`; img.alt=a.strArea||'area';
      img.addEventListener('error', ()=>{ 
        img.style.display='none'; 
        const f=el('div','area-svg'); 
        f.innerHTML=`<svg width="48" height="48"><path d="M12 3l9 7h-3v8h-4v-6H10v6H6v-8H3l9-7z" fill="#fff"/></svg>`; 
        iconWrap.appendChild(f); 
      });
      iconWrap.appendChild(img);

      const label=el('div','area-label'); label.textContent=a.strArea;
      card.append(iconWrap,label);

      const openArea=async ()=>{
        showSpinner(mealsGrid);
        const r=await fetchJSON(API+'filter.php?a='+encodeURIComponent(a.strArea));
        clearControls(); // hide area list
        renderMeals(r?.meals||[]);
        try{ closeSidebar(); }catch(e){}
      };
      card.addEventListener('click', openArea);
      card.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'||ev.key===' ') openArea(); });
      grid.appendChild(card);
    });

    controlsArea.appendChild(grid);
  }

  // --- Updated actionIngredients ---
  async function actionIngredients(){
    clearControls(); clearMeals(); controlsArea.innerHTML='<p class="text-muted">Loading ingredients...</p>';
    const d=await fetchJSON(API+'list.php?i=list'); clearControls();
    if(!d?.meals){ controlsArea.innerHTML='<p class="text-muted">No ingredients.</p>'; return; }

    const grid=el('div','ingredients-grid');
    d.meals.slice(0,60).forEach(it=>{
      const card=el('div','ingredient-card'); 
      card.setAttribute('role','button'); 
      card.setAttribute('tabindex','0'); 
      card.setAttribute('aria-label',`Filter by ${it.strIngredient}`);

      const iconWrap=el('div','ingredient-icon'); 
      const slug=it.strIngredient.toLowerCase().replace(/[^a-z0-9]+/g,'-');
      const img=el('img','ingredient-img'); 
      img.src=`./imges/ingredients/${slug}.png`; img.alt=it.strIngredient||'ingredient'; img.loading='lazy'; img.decoding='async';
      img.addEventListener('error', ()=>{ 
        img.style.display='none'; 
        const f=el('div','ingredient-svg'); 
        f.innerHTML=`<svg width="48" height="48"><path d="M12 3l9 7h-3v8h-4v-6H10v6H6v-8H3l9-7z" fill="#fff"/></svg>`; 
        iconWrap.appendChild(f); 
      });
      iconWrap.appendChild(img);

      const title=el('div','ingredient-title'); title.textContent=it.strIngredient;
      const desc=el('div','ingredient-desc'); desc.textContent=it.strDescription?.slice(0,140)+'...'||'';
      card.append(iconWrap,title,desc);

      const openIngredient=async ()=>{
        showSpinner(mealsGrid);
        const r=await fetchJSON(API+'filter.php?i='+encodeURIComponent(it.strIngredient));
        clearControls(); // hide ingredient list
        renderMeals(r?.meals||[]);
        try{ closeSidebar(); }catch(e){}
      };
      card.addEventListener('click', openIngredient); 
      card.addEventListener('keydown',(ev)=>{ if(ev.key==='Enter'||ev.key===' ') openIngredient(); });

      grid.appendChild(card);
    });
    controlsArea.appendChild(grid);
  }

  function actionContact(){
    clearControls(); clearMeals();
    const card=el('div','card bg-dark border-0 p-3');
    card.innerHTML=`
      <form id="contactForm" class="row g-2">
        <div class="col-md-6"><input id="nameInput" class="form-control bg-secondary text-light" placeholder="Name"><div class="form-text text-muted small">Only letters & spaces (2-30)</div></div>
        <div class="col-md-6"><input id="emailInput" class="form-control bg-secondary text-light" placeholder="Email"><div class="form-text text-muted small">Valid email</div></div>
        <div class="col-md-4"><input id="phoneInput" class="form-control bg-secondary text-light" placeholder="Phone"></div>
        <div class="col-md-4"><input id="ageInput" class="form-control bg-secondary text-light" placeholder="Age"></div>
        <div class="col-md-4"><input id="passInput" type="password" class="form-control bg-secondary text-light" placeholder="Password"></div>
        <div class="col-12"><input id="repassInput" type="password" class="form-control bg-secondary text-light" placeholder="Re-type Password"></div>
        <div class="col-12 text-end"><button id="submitBtn" class="btn btn-success" type="submit" disabled>Submit</button></div>
      </form>
    `;
    controlsArea.appendChild(card);

    const nameRe=/^[A-Za-z\s]{2,30}$/; const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; const phoneRe=/^\+?\d{7,15}$/;
    const ageRe=/^(?:[1-9][0-9]?|1[01][0-9])$/; const passRe=/^.{6,}$/;
    const inputs=['nameInput','emailInput','phoneInput','ageInput','passInput','repassInput'].map(id=>document.getElementById(id));
    const submitBtn=document.getElementById('submitBtn');

    function setInvalid(el,state){ if(!el) return; state?el.classList.add('is-invalid'):el.classList.remove('is-invalid'); }

    function validate(){
      const [name,email,phone,age,pass,repass]=inputs.map(i=>i.value.trim());
      const ok=nameRe.test(name)&&emailRe.test(email)&&phoneRe.test(phone)&&ageRe.test(age)&&passRe.test(pass)&&pass===repass;
      setInvalid(inputs[0],!nameRe.test(name)); setInvalid(inputs[1],!emailRe.test(email));
      setInvalid(inputs[2],!phoneRe.test(phone)); setInvalid(inputs[3],!ageRe.test(age));
      setInvalid(inputs[4],!passRe.test(pass)); setInvalid(inputs[5],pass!==repass||!pass.length);
      submitBtn.disabled=!ok;
    }

    inputs.forEach(i=>i.addEventListener('input',validate));
    document.getElementById('contactForm').addEventListener('submit', e=>{ e.preventDefault(); alert('Form valid (demo)'); document.getElementById('contactForm').reset(); inputs.forEach(i=>setInvalid(i,false)); submitBtn.disabled=true; });

    closeSidebar();
  }

  // --- menu delegation ---
  menuList.addEventListener('click', (e)=>{
    const action=e.target.dataset.action; if(!action) return;
    switch(action){
      case 'search': actionSearch(); break;
      case 'categories': actionCategories(); break;
      case 'area': actionArea(); break;
      case 'ingredients': actionIngredients(); break;
      case 'contact': actionContact(); break;
    }
  });

  // --- initial load ---
  (async ()=>{
    showSpinner(mealsGrid);
    const last=getLastSearch();
    const d=last ? await fetchJSON(API+'search.php?s='+encodeURIComponent(last)) : await fetchJSON(API+'search.php?s=');
    renderMeals(d?.meals||[]);
  })();

});
