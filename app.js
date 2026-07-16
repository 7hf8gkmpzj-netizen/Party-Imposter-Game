(() => {
  "use strict";

  const BUILTIN = {
    "Superheroes": {emoji:"🦸", words:["Batman","Superman","Spider-Man","Iron Man","Captain America","Hulk","Thor","Wonder Woman","Flash","Wolverine","Deadpool","Black Panther","Doctor Strange","Green Lantern"]},
    "Animals": {emoji:"🦁", words:["Lion","Tiger","Cheetah","Giraffe","Gazelle","Hammerhead Shark","Great White Shark","Trout","Beaver","Otter","Dolphin","Whale","Orca","Kangaroo","Ostrich","Emu","Great Dane","Greyhound","Eagle","Hawk","Panda","Grizzly Bear","Polar Bear","Crocodile","Alligator","Gorilla","Orangutan","Octopus","Squid","Centipede","Cow","Horse","Lamb","Skunk"]},
    "Food": {emoji:"🍕", words:["Pizza","Pasta","Popcorn","Sushi","Taco","Steak","Lamb Chops","Donut","Cheese","Ice Cream","Burrito","Bacon"]},
    "Sports/Activities": {emoji:"🏈", words:["Football","Fishing","Basketball","Soccer","Tennis","Pickleball","Badminton","Hockey","Swimming","Golf","Hunting","Hiking","MMA","Boxing","Wrestling","Surfing"]},
    "Entertainment": {emoji:"🎬", words:["Walter White","SpongeBob","Patrick Star","Mr. Krabs","Fairly OddParents","The Office","Lightning McQueen","Mater","Darth Vader","Harry Potter","Donkey","Shrek","Buzz Lightyear","Monsters, Inc.","Yoda","Goku"]},
    "Travel": {emoji:"✈️", words:["Rio de Janeiro","Paris","Rome","Philadelphia","New York","Las Vegas","Tokyo","London","Germany","Miami"]},
    "Jobs": {emoji:"🧰", words:["Firefighter","Doctor","Electrician","Mechanic","Police Officer","Teacher","Pilot","Software IT","Chef","Farmer","Dentist","President","Lawyer"]},
    "History": {emoji:"🏛️", words:["George Washington","9/11","Hiroshima","Abraham Lincoln","Adolf Hitler","Oppenheimer","Martin Luther King Jr.","Vladimir Putin","Donald Trump","Pirate","Viking","Samurai","Knight","Holocaust","Slavery","George W. Bush","Taliban","Pearl Harbor"]}
  };

  let customPacks = {};
  let selectedCategory = "Random All Categories";
  let editingName = null;
  let state = null;

  const $ = id => document.getElementById(id);

  function safeLoad(){
    try{
      const raw = localStorage.getItem("impostorHintCustomPacks");
      customPacks = raw ? JSON.parse(raw) : {};
    }catch(_){ customPacks = {}; }
  }

  function safeSave(){
    try{
      localStorage.setItem("impostorHintCustomPacks", JSON.stringify(customPacks));
      return true;
    }catch(_){ return false; }
  }

  function allPacks(){
    const merged = {...BUILTIN};
    Object.entries(customPacks).forEach(([name, words]) => {
      merged[name] = {emoji:"✨", words};
    });
    return merged;
  }

  function selectablePacks(){
    return {
      "Random All Categories": {emoji:"🎲", words:[]},
      ...allPacks()
    };
  }

  function showScreen(id){
    document.querySelectorAll(".screen").forEach(el => el.classList.toggle("active", el.id === id));
    window.scrollTo(0,0);
  }

  function shuffle(items){
    const a = [...items];
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function renderCategories(){
    const grid = $("categoryGrid");
    grid.innerHTML = "";
    Object.entries(selectablePacks()).forEach(([name, pack]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-btn" + (name === selectedCategory ? " selected" : "");
      btn.innerHTML = `<span class="emoji">${pack.emoji}</span>
        <div class="name">${escapeHTML(name)}</div>
        <div class="count">${name === "Random All Categories" ? "Any category" : `${pack.words.length} words`}</div>`;
      btn.addEventListener("click", () => {
        selectedCategory = name;
        renderCategories();
      });
      grid.appendChild(btn);
    });
  }

  function escapeHTML(value){
    return String(value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function parseWords(text){
    return [...new Set(text.split(/\n|,/).map(v => v.trim()).filter(Boolean))];
  }

  function renderSaved(){
    const list = $("savedList");
    list.innerHTML = "";
    const names = Object.keys(customPacks).sort();
    if(!names.length){
      list.innerHTML = `<div class="muted">No custom categories saved yet.</div>`;
      return;
    }
    names.forEach(name => {
      const row = document.createElement("div");
      row.className = "saved-item";
      row.innerHTML = `<div><strong>${escapeHTML(name)}</strong><span>${customPacks[name].length} words</span></div>
        <div class="mini-actions">
          <button type="button" class="secondary" data-edit="${encodeURIComponent(name)}">Edit</button>
          <button type="button" class="danger" data-delete="${encodeURIComponent(name)}">Delete</button>
        </div>`;
      list.appendChild(row);
    });
  }

  function startRound(){
    const players = Math.max(3, Math.min(20, Number.parseInt($("players").value || "4",10)));
    const impostors = Math.max(1, Math.min(players-1, Number.parseInt($("impostors").value || "1",10)));
    $("players").value = players;
    $("impostors").value = impostors;

    let chosenCategory = selectedCategory;
    let pack;

    if(selectedCategory === "Random All Categories"){
      const available = Object.entries(allPacks()).filter(([, p]) => p.words && p.words.length);
      if(!available.length){
        alert("No categories are available.");
        return;
      }
      const picked = available[Math.floor(Math.random()*available.length)];
      chosenCategory = picked[0];
      pack = picked[1];
    }else{
      pack = allPacks()[selectedCategory];
    }

    if(!pack || !pack.words.length){
      alert("Choose a category with at least one word.");
      return;
    }

    const roles = shuffle([
      ...Array(impostors).fill("impostor"),
      ...Array(players-impostors).fill("word")
    ]);

    state = {
      players,
      impostors,
      category:chosenCategory,
      word:pack.words[Math.floor(Math.random()*pack.words.length)],
      roles,
      current:0
    };
    updateHandoff();
    showScreen("handoff");
  }

  function updateHandoff(){
    $("handoffCount").textContent = `Player ${state.current+1} of ${state.players}`;
  }

  function revealRole(){
    const role = state.roles[state.current];
    $("revealCount").textContent = `Player ${state.current+1} of ${state.players}`;
    const shell = $("roleShell");
    shell.className = "role-shell " + (role === "impostor" ? "impostor" : "word");

    if(role === "impostor"){
      $("roleLabel").textContent = "Your role";
      $("roleValue").textContent = "IMPOSTOR";
      $("hintBox").textContent = `Hint: ${state.category}`;
    }else{
      $("roleLabel").textContent = "Your word";
      $("roleValue").textContent = state.word;
      $("hintBox").textContent = `Category: ${state.category}`;
    }
    showScreen("reveal");
  }

  function hideAndPass(){
    state.current += 1;
    if(state.current >= state.players){
      showScreen("ready");
    }else{
      updateHandoff();
      showScreen("handoff");
    }
  }

  $("startBtn").addEventListener("click", startRound);
  $("customBtn").addEventListener("click", () => { renderSaved(); showScreen("custom"); });
  $("customBackBtn").addEventListener("click", () => { renderCategories(); showScreen("setup"); });
  $("revealBtn").addEventListener("click", revealRole);
  $("hideBtn").addEventListener("click", hideAndPass);
  $("againBtn").addEventListener("click", startRound);
  $("changeBtn").addEventListener("click", () => showScreen("setup"));

  $("saveCustomBtn").addEventListener("click", () => {
    const name = $("customName").value.trim();
    const words = parseWords($("customWords").value);
    if(!name){ alert("Enter a category name."); return; }
    if(words.length < 2){ alert("Enter at least two words."); return; }

    if(editingName && editingName !== name) delete customPacks[editingName];
    customPacks[name] = words;
    safeSave();
    selectedCategory = name;
    editingName = null;
    $("customName").value = "";
    $("customWords").value = "";
    renderSaved();
    renderCategories();
    alert("Category saved.");
  });

  $("savedList").addEventListener("click", event => {
    const edit = event.target.dataset.edit;
    const del = event.target.dataset.delete;
    if(edit){
      const name = decodeURIComponent(edit);
      editingName = name;
      $("customName").value = name;
      $("customWords").value = customPacks[name].join("\n");
      window.scrollTo(0,0);
    }
    if(del){
      const name = decodeURIComponent(del);
      if(confirm(`Delete "${name}"?`)){
        delete customPacks[name];
        safeSave();
        if(selectedCategory === name) selectedCategory = "Random All Categories";
        renderSaved();
        renderCategories();
      }
    }
  });

  safeLoad();
  renderCategories();
  renderSaved();
  $("testBadge").style.display = "block";

  window.__IMPOSTOR_HINT_TEST__ = {
    packs: allPacks,
    shuffle,
    startRound,
    getState: () => state,
    selectCategory: name => { if(allPacks()[name]){ selectedCategory=name; renderCategories(); } }
  };

  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
  }
})();
