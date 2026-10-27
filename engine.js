/* Shared solo-quiz engine for the Geography games. Each page defines
   GAME_SETS (array of {id,label,categories}) and STORAGE_KEY before loading
   this file; map-data.js must be loaded first for the REGIONS lookup.
   Each category carries a `pool` of plausible plain-text answers used to
   build multiple-choice options; each clue carries `correct` (plain text,
   must appear in its category's pool) instead of a free-response answer. */
(function(){
  "use strict";

  var REGIONS = {
    us: { states: US_STATES, meta: { width: US_NATION.width, height: US_NATION.height, borders: US_NATION.borders }, cities: US_CITIES },
    europe: { states: EUROPE_STATES, meta: EUROPE_META, cities: EUROPE_CITIES },
    atlantic: { states: ATLANTIC_STATES, meta: ATLANTIC_META, cities: ATLANTIC_CITIES }
  };

  // Maps are drawn with no city-name or zone-name text labels, only shaded
  // regions, pin dots, routes, and (non-revealing) legend swatches, so a
  // multiple-choice clue's map never spells out the answer.
  function buildMapSVG(m){
    if(!m) return "";
    var region = REGIONS[m.region];
    var W = region.meta.width, H = region.meta.height;
    var highlight = m.highlight || [];
    var highlightAlt = m.highlightAlt || [];
    var routes = m.routes || [];
    var pins = m.pins || [];
    var zones = m.zones || [];
    var parts = [];
    var uid = "map" + Math.random().toString(36).slice(2,8);
    parts.push('<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Map">');
    parts.push('<rect width="100%" height="100%" fill="var(--map-bg)"/>');
    parts.push('<defs><marker id="arrow-'+uid+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--gold-bright)"/></marker></defs>');
    for(var name in region.states){
      var fill = "var(--map-land)";
      if(highlightAlt.indexOf(name) !== -1) fill = "var(--burgundy-bright)";
      else if(highlight.indexOf(name) !== -1) fill = "var(--map-land-hi)";
      parts.push('<path d="'+region.states[name]+'" fill="'+fill+'" stroke="none"/>');
    }
    parts.push('<path d="'+region.meta.borders+'" fill="none" stroke="var(--map-line)" stroke-width="0.8"/>');
    for(var z=0;z<zones.length;z++){
      var zo = zones[z];
      parts.push('<ellipse cx="'+zo.cx+'" cy="'+zo.cy+'" rx="'+zo.rx+'" ry="'+zo.ry+'" fill="var(--burgundy-bright)" fill-opacity="0.2" stroke="var(--burgundy-bright)" stroke-width="1.5" stroke-dasharray="5 4"/>');
    }
    for(var r=0;r<routes.length;r++){
      var from = region.cities[routes[r].from], to = region.cities[routes[r].to];
      if(!from||!to) continue;
      var mx=(from.x+to.x)/2, my=(from.y+to.y)/2-34;
      parts.push('<path d="M'+from.x+','+from.y+' Q'+mx+','+my+' '+to.x+','+to.y+'" fill="none" stroke="var(--gold-bright)" stroke-width="2.4" stroke-dasharray="6 5" marker-end="url(#arrow-'+uid+')"/>');
    }
    for(var p=0;p<pins.length;p++){
      var pin = pins[p];
      var c = region.cities[pin.name];
      if(!c) continue;
      parts.push('<circle cx="'+c.x+'" cy="'+c.y+'" r="6.5" fill="var(--burgundy-bright)" stroke="var(--map-bg)" stroke-width="2"/>');
    }
    parts.push('</svg>');
    return parts.join('');
  }

  function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }
  function buildChoices(pool, correct){
    var distractors = shuffle(pool.filter(function(p){ return p !== correct; }));
    var options = shuffle(distractors.slice(0,3).concat([correct]));
    return options;
  }

  var VALUES = [100,200,300,400,500];
  var CATEGORIES = GAME_SETS[0].categories;
  function applySet(setId){
    var found = null;
    for(var i=0;i<GAME_SETS.length;i++){ if(GAME_SETS[i].id === setId){ found = GAME_SETS[i]; break; } }
    if(!found) found = GAME_SETS[0];
    CATEGORIES = found.categories;
    state.setId = found.id;
    var lbl = document.getElementById("currentSetLabel");
    if(lbl) lbl.textContent = found.label;
  }

  /* ---------------- Sound (Web Audio, synthesized) ---------------- */
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var actx = null;
  var soundOn = true;
  function ctx(){ if(!actx && AudioCtx){ try{ actx = new AudioCtx(); }catch(e){ actx = null; } } return actx; }
  function tone(freq, start, dur, type, gain){
    var c = ctx(); if(!c || !soundOn || !freq) return;
    try{
      var osc = c.createOscillator(); var g = c.createGain();
      osc.type = type || "sine"; osc.frequency.value = freq;
      g.gain.value = 0;
      osc.connect(g); g.connect(c.destination);
      var t0 = c.currentTime + start;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain || 0.18, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    }catch(e){}
  }
  function sfxSelect(){ tone(740,0,0.12,"triangle",0.15); tone(988,0.05,0.14,"triangle",0.13); }
  function sfxCorrect(){ tone(523.25,0,0.14,"sine",0.18); tone(659.25,0.1,0.16,"sine",0.18); tone(784,0.2,0.26,"sine",0.2); }
  function sfxWrong(){ tone(196,0,0.22,"sawtooth",0.16); tone(174.6,0.14,0.3,"sawtooth",0.16); }
  function sfxTick(){ tone(1046,0,0.045,"square",0.06); }
  function sfxTimeUp(){ tone(220,0,0.3,"sawtooth",0.18); tone(174.6,0.12,0.35,"sawtooth",0.18); }
  function sfxDailyDouble(){ var notes=[392,523.25,659.25,784,987.77]; for(var i=0;i<notes.length;i++){ tone(notes[i], i*0.12, 0.3, "triangle", 0.2); } }
  function sfxFanfare(){ var notes=[523.25,659.25,784,1046.5]; for(var i=0;i<notes.length;i++){ tone(notes[i], i*0.14, 0.4, "triangle", 0.2); } }

  function pluckTone(freq, start, dur, gain){
    var c = ctx(); if(!c || !soundOn || !freq) return;
    try{
      var t0 = c.currentTime + start;
      var osc1 = c.createOscillator(), g1 = c.createGain();
      osc1.type = "triangle"; osc1.frequency.value = freq;
      osc1.connect(g1); g1.connect(c.destination);
      g1.gain.setValueAtTime(0, t0);
      g1.gain.linearRampToValueAtTime(gain, t0 + 0.012);
      g1.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc1.start(t0); osc1.stop(t0 + dur + 0.02);
      var osc2 = c.createOscillator(), g2 = c.createGain();
      osc2.type = "sine"; osc2.frequency.value = freq * 2;
      osc2.connect(g2); g2.connect(c.destination);
      g2.gain.setValueAtTime(0, t0);
      g2.gain.linearRampToValueAtTime(gain * 0.32, t0 + 0.008);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.55);
      osc2.start(t0); osc2.stop(t0 + dur * 0.55 + 0.02);
    }catch(e){}
  }
  function clockTick(gain){ tone(1800, 0, 0.025, "square", gain); }
  var THINK_MELODY = [392.00,null,349.23,392.00,440.00,null,392.00,349.23,329.63,null,349.23,392.00,440.00,493.88,440.00,null];
  var thinkTimeoutId=null, thinkStep=0, thinkProgress=0;
  function setThinkProgress(p){ thinkProgress = Math.max(0, Math.min(1,p)); }
  function scheduleThink(){
    var interval = 520 - thinkProgress*320;
    var noteGain = 0.10 + thinkProgress*0.12;
    var tickGain = 0.045 + thinkProgress*0.06;
    var dur = Math.max(0.14, (interval/1000)*0.9);
    var freq = THINK_MELODY[thinkStep % THINK_MELODY.length];
    if(freq) pluckTone(freq, 0, dur, noteGain);
    clockTick(tickGain);
    thinkStep++;
    thinkTimeoutId = setTimeout(scheduleThink, interval);
  }
  function startThinkingMusic(){ stopThinkingMusic(); thinkStep=0; thinkProgress=0; scheduleThink(); }
  function stopThinkingMusic(){ if(thinkTimeoutId){ clearTimeout(thinkTimeoutId); thinkTimeoutId=null; } }

  /* ---------------- State (solo only) ---------------- */
  var TOTAL_TILES = VALUES.length * CATEGORIES.length;
  var state = {
    name: "", score: 0, used: {}, dailyDoubles: [], started: false, setId: GAME_SETS[0].id
  };

  function storageSafeGet(key){ try{ var v=localStorage.getItem(key); return v?JSON.parse(v):null; }catch(e){ return null; } }
  function storageSafeSet(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

  function pickDailyDoubles(){
    var keys = [];
    for(var c=0;c<CATEGORIES.length;c++){ for(var v=0;v<VALUES.length;v++){ keys.push(c+"-"+v); } }
    var pool = keys.filter(function(k){ return k.split("-")[1] !== "0"; });
    var chosen = [];
    while(chosen.length < 2 && pool.length){
      var idx = Math.floor(Math.random()*pool.length);
      chosen.push(pool.splice(idx,1)[0]);
    }
    return chosen;
  }

  /* ---------------- Scoreboard ---------------- */
  var scoreboardEl = document.getElementById("scoreboard");
  function renderScoreboard(){
    scoreboardEl.innerHTML = "";
    var card = document.createElement("div");
    card.className = "team-card active";
    var nameRow = document.createElement("div");
    nameRow.className = "team-name-row";
    var nameInput = document.createElement("input");
    nameInput.className = "team-name"; nameInput.value = state.name || "";
    nameInput.placeholder = "Your name";
    nameInput.setAttribute("aria-label","Your name");
    nameInput.addEventListener("change", function(){
      state.name = nameInput.value.trim();
      saveState();
    });
    nameRow.appendChild(nameInput); card.appendChild(nameRow);
    var scoreEl = document.createElement("div");
    scoreEl.className = "team-score" + (state.score<0 ? " neg" : "");
    scoreEl.textContent = "$" + state.score;
    card.appendChild(scoreEl);
    var tilesLeft = document.createElement("div");
    tilesLeft.style.cssText = "font-size:12px;color:var(--ink-dim);margin-top:4px;font-family:'Josefin Sans',sans-serif;";
    var usedCount = Object.keys(state.used).length;
    tilesLeft.textContent = usedCount + " / " + TOTAL_TILES + " clues answered";
    card.appendChild(tilesLeft);
    scoreboardEl.appendChild(card);
  }

  /* ---------------- Board ---------------- */
  var boardEl = document.getElementById("board");
  function renderBoard(){
    boardEl.innerHTML = "";
    CATEGORIES.forEach(function(cat){
      var head = document.createElement("div");
      head.className = "cat-head"; head.textContent = cat.name;
      boardEl.appendChild(head);
    });
    for(var v=0; v<VALUES.length; v++){
      for(var c=0; c<CATEGORIES.length; c++){
        var key = c+"-"+v;
        var tile = document.createElement("div");
        var used = !!state.used[key];
        tile.className = "tile" + (used ? " used" : "");
        tile.textContent = used ? "" : ("$"+VALUES[v]);
        tile.tabIndex = used ? -1 : 0;
        tile.setAttribute("role","button");
        tile.setAttribute("aria-label", used ? "Used clue" : (CATEGORIES[c].name + " for $" + VALUES[v]));
        (function(c,v,key){
          function activate(){ if(state.used[key]) return; sfxSelect(); openClue(c,v,key); }
          tile.addEventListener("click", activate);
          tile.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); activate(); } });
        })(c,v,key);
        boardEl.appendChild(tile);
      }
    }
  }

  /* ---------------- Clue overlay ---------------- */
  var clueOverlay = document.getElementById("clueOverlay");
  var clueStage = document.getElementById("clueStage");
  var timerInterval = null;
  function clearTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } stopThinkingMusic(); }
  function closeClue(){ clearTimer(); clueOverlay.hidden = true; clueStage.innerHTML = ""; }

  function openClue(c,v,key){
    var isDD = state.dailyDoubles.indexOf(key) !== -1;
    var data = CATEGORIES[c].clues[v];
    var value = VALUES[v];
    if(isDD){ renderDailyDoubleWager(c,v,key,data,value); }
    else { renderClueCard(c,v,key,data,value,value,false); }
    clueOverlay.hidden = false;
  }

  function renderDailyDoubleWager(c,v,key,data,baseValue){
    sfxDailyDouble(); clearTimer();
    var maxWager = Math.max(baseValue*2, Math.max(500, state.score));
    clueStage.innerHTML =
      '<div class="dd-banner">DAILY DOUBLE</div>' +
      '<p class="hint">Wager your points. Minimum $5, up to $' + maxWager + '.</p>' +
      '<input class="wager-input" id="wagerInput" type="number" inputmode="numeric" min="5" max="'+maxWager+'" step="5" value="'+Math.min(baseValue,maxWager)+'" aria-label="Wager amount">' +
      '<div class="stage-actions" style="justify-content:center;"><button class="primary" id="wagerGo">Lock In Wager</button></div>';
    var input = clueStage.querySelector("#wagerInput");
    clueStage.querySelector("#wagerGo").addEventListener("click", function(){
      var w = parseInt(input.value,10);
      if(isNaN(w) || w<5) w=5;
      if(w>maxWager) w=maxWager;
      renderClueCard(c,v,key,data,baseValue,w,true);
    });
  }

  function renderClueCard(c,v,key,data,baseValue,pointValue,isDD){
    clearTimer();
    var timeLimit = 25;
    var mapHtml = data.map ? buildMapSVG(data.map) : "";
    var options = buildChoices(CATEGORIES[c].pool, data.correct);
    var answered = false;

    clueStage.innerHTML =
      '<div class="stage-kicker"><span>' + escapeHtml(CATEGORIES[c].name) + (isDD?' &middot; DAILY DOUBLE':'') + '</span><span>$' + pointValue + '</span></div>' +
      '<div class="timer-bar"><div class="timer-fill" id="timerFill"></div></div>' +
      '<div class="clue-layout' + (mapHtml ? '' : ' no-map') + '">' +
        '<div class="clue-body">' +
          '<div class="clue-text">' + escapeHtml(data.clue) + '</div>' +
          '<div class="choice-grid" id="choiceGrid"></div>' +
          '<div class="result-banner" id="resultBanner" hidden></div>' +
        '</div>' +
        (mapHtml ? ('<div class="map-frame">' + mapHtml + '<p class="map-caption">Real boundary data, not a licensed map image</p></div>') : '') +
      '</div>' +
      '<div class="stage-actions" id="stageActions" hidden>' +
        '<button class="primary" id="btnContinue">Continue</button>' +
      '</div>';

    var choiceGrid = clueStage.querySelector("#choiceGrid");
    options.forEach(function(opt){
      var b = document.createElement("button");
      b.className = "choice-btn";
      b.textContent = opt;
      b.addEventListener("click", function(){ lockAnswer(opt, b); });
      choiceGrid.appendChild(b);
    });

    var fill = clueStage.querySelector("#timerFill");
    var secondsLeft = timeLimit;
    startThinkingMusic();
    timerInterval = setInterval(function(){
      secondsLeft -= 1;
      var pct = Math.max(0, secondsLeft/timeLimit*100);
      fill.style.width = pct + "%";
      setThinkProgress((timeLimit-secondsLeft)/timeLimit);
      if(secondsLeft<=5 && secondsLeft>0) sfxTick();
      if(secondsLeft<=0){ clearTimer(); sfxTimeUp(); if(!answered) lockAnswer(null, null); }
    }, 1000);

    function lockAnswer(chosen, btn){
      if(answered) return;
      answered = true;
      clearTimer();
      var correct = chosen === data.correct;
      var allBtns = choiceGrid.querySelectorAll(".choice-btn");
      allBtns.forEach(function(el){
        el.disabled = true;
        if(el.textContent === data.correct) el.classList.add("correct");
        else if(el === btn) el.classList.add("incorrect");
      });
      var banner = clueStage.querySelector("#resultBanner");
      banner.hidden = false;
      if(correct){
        state.score += pointValue;
        sfxCorrect();
        banner.className = "result-banner correct";
        banner.textContent = isDD ? ("Correct! +$" + pointValue + " wagered.") : ("Correct! +$" + pointValue + ".");
      } else {
        var delta = isDD ? -pointValue : 0;
        state.score += delta;
        sfxWrong();
        banner.className = "result-banner incorrect";
        var msg = chosen ? "Not quite." : "Time's up.";
        msg += " The correct answer is " + data.correct + ".";
        if(delta) msg += " -$" + pointValue + " wagered.";
        banner.textContent = msg;
      }
      saveState(); renderScoreboard();
      clueStage.querySelector("#stageActions").hidden = false;
      clueStage.querySelector("#btnContinue").addEventListener("click", function(){
        markUsed(key); saveState(); renderScoreboard(); renderBoard(); closeClue(); maybeEndGame();
      });
    }
  }

  function markUsed(key){ state.used[key] = true; }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(ch){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]; });
  }

  function maybeEndGame(){
    if(Object.keys(state.used).length >= TOTAL_TILES){
      showGameOver();
    }
  }

  /* ---------------- Game over screen ---------------- */
  var gameOverOverlay = document.getElementById("gameOverOverlay");
  var gameOverStage = document.getElementById("gameOverStage");
  function showGameOver(){
    sfxFanfare();
    var maxScore = VALUES.reduce(function(a,b){return a+b;},0) * CATEGORIES.length;
    gameOverStage.innerHTML =
      '<div class="dd-banner" style="background:var(--emerald);">GAME OVER</div>' +
      '<h2 style="text-align:center;color:var(--gold-bright);font-size:clamp(28px,5vw,40px);margin:10px 0 4px;">' + (state.name ? escapeHtml(state.name) + "'s " : "Your ") + 'Final Score</h2>' +
      '<div style="text-align:center;font-family:\'Bebas Neue\',sans-serif;font-size:clamp(48px,9vw,78px);color:var(--ink);margin:6px 0 18px;">$' + state.score + '</div>' +
      '<p style="text-align:center;color:var(--ink-dim);font-family:\'Josefin Sans\',sans-serif;font-size:13px;margin-bottom:22px;">(out of $' + maxScore + ' possible, not counting Daily Double wagers)</p>' +
      '<div style="background:var(--surface);border:1.5px solid var(--gold);border-radius:10px;padding:18px 20px;margin-bottom:20px;">' +
        '<p style="font-family:\'Josefin Sans\',sans-serif;font-weight:700;color:var(--gold);letter-spacing:.08em;text-transform:uppercase;font-size:13px;margin:0 0 8px;">Mapping It Out &mdash; Extension Activity</p>' +
        '<p style="color:var(--ink);font-family:\'Libre Caslon Text\', Georgia, serif;font-size:16px;line-height:1.5;margin:0;">Take a screenshot of this screen showing your score, then post it in Google Classroom under <strong>&ldquo;Mapping it out extension activity.&rdquo;</strong></p>' +
      '</div>' +
      '<div class="stage-actions" style="justify-content:center;">' +
        '<button class="primary" id="btnPlayAgain">Play Again</button>' +
      '</div>';
    clueOverlay.hidden = true;
    gameOverOverlay.hidden = false;
    gameOverStage.querySelector("#btnPlayAgain").addEventListener("click", function(){
      gameOverOverlay.hidden = true;
      openSetup();
    });
  }

  /* ---------------- Setup overlay ---------------- */
  var setupOverlay = document.getElementById("setupOverlay");
  var setupNamesEl = document.getElementById("setupNames");
  var setPickerEl = document.getElementById("setPicker");
  var setChoice = GAME_SETS[0].id;

  function renderSetPicker(){
    if(!setPickerEl) return;
    setPickerEl.innerHTML = "";
    GAME_SETS.forEach(function(s){
      var b = document.createElement("button");
      b.textContent = s.label;
      b.className = s.id===setChoice ? "selected" : "";
      b.addEventListener("click", function(){ setChoice = s.id; renderSetPicker(); });
      setPickerEl.appendChild(b);
    });
  }
  function renderSetupName(){
    setupNamesEl.innerHTML = "";
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Your name (optional)";
    input.value = state.name || "";
    input.id = "setupNameInput";
    setupNamesEl.appendChild(input);
  }
  function openSetup(){
    setChoice = state.setId || GAME_SETS[0].id;
    renderSetPicker(); renderSetupName();
    setupOverlay.hidden = false;
  }

  document.getElementById("btnStart").addEventListener("click", function(){
    var nameVal = document.getElementById("setupNameInput").value.trim();
    applySet(setChoice);
    state.name = nameVal; state.score = 0; state.used = {};
    state.dailyDoubles = pickDailyDoubles(); state.started = true;
    saveState(); renderScoreboard(); renderBoard();
    setupOverlay.hidden = true; sfxSelect();
  });

  document.getElementById("btnNewTeams").addEventListener("click", function(){
    openSetup();
  });

  document.getElementById("btnReset").addEventListener("click", function(){
    state.used = {}; state.dailyDoubles = pickDailyDoubles(); state.score = 0;
    saveState(); renderScoreboard(); renderBoard();
  });

  document.getElementById("btnSound").addEventListener("click", function(){
    soundOn = !soundOn;
    this.textContent = soundOn ? "🔊 Sound On" : "🔇 Sound Off";
    this.setAttribute("aria-pressed", soundOn ? "true" : "false");
    if(soundOn) sfxSelect();
  });

  /* ---------------- Persistence ---------------- */
  function saveState(){ storageSafeSet(STORAGE_KEY, state); }
  function loadState(){
    var saved = storageSafeGet(STORAGE_KEY);
    if(saved && typeof saved.score === "number"){ state = saved; }
  }

  /* ---------------- Hot update support ---------------- */
  function snapshot(){ return state; }
  function boot(initial){
    if(initial) state = initial; else loadState();
    applySet(state.setId || GAME_SETS[0].id);
    renderScoreboard(); renderBoard();
    if(state.started){ setupOverlay.hidden = true; }
    else { openSetup(); }
  }
  if(window.claude && window.claude.hot){
    window.claude.hot.snapshot(snapshot);
    if(window.claude.hot.ready){ window.claude.hot.ready(boot); } else { boot(window.claude.hot.data || null); }
  } else {
    boot(null);
  }
})();
