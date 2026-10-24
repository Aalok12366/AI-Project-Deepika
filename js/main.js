//3D background


(function () {
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('bg-canvas');
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070a14, 14, 34);

  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Lights
  scene.add(new THREE.AmbientLight(0x445566, 0.4));
  var light1 = new THREE.PointLight(0x4bd8ff, 1.2, 100);
  light1.position.set(10, 10, 10);
  scene.add(light1);
  var light2 = new THREE.PointLight(0xf5a623, 0.8, 100);
  light2.position.set(-10, -10, -5);
  scene.add(light2);

  // ── Star field ──
  var starCount = 1400;
  var starPositions = new Float32Array(starCount * 3);
  for (var i = 0; i < starCount; i++) {
    var r = 8 + Math.random() * 30;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  var stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      size: 0.05,
      color: 0x4bd8ff,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  scene.add(stars);

  // ── Floating nodes ──
  var palette = [0x1ac4f0, 0x4bd8ff, 0x06a3d6, 0xf5a623, 0x8ae9ff];
  var nodeGroup = new THREE.Group();
  var nodeMeshes = [];
  var nodeCount = 26;
  for (var n = 0; n < nodeCount; n++) {
    var mat = new THREE.MeshStandardMaterial({
      color: palette[Math.floor(Math.random() * palette.length)],
      emissive: palette[Math.floor(Math.random() * palette.length)],
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.7,
    });
    var mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), mat);
    mesh.position.set(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 12 - 4
    );
    var s = 0.12 + Math.random() * 0.28;
    mesh.scale.set(s, s, s);
    nodeGroup.add(mesh);
    nodeMeshes.push(mesh);
  }
  scene.add(nodeGroup);

  // ── Connection lines ──
  var linePts = [];
  var linePoints = [];
  for (var p = 0; p < 30; p++) {
    linePoints.push([
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 10 - 3,
    ]);
  }
  for (var a = 0; a < linePoints.length; a++) {
    for (var b = a + 1; b < linePoints.length; b++) {
      var pa = linePoints[a];
      var pb = linePoints[b];
      var dist = Math.sqrt(
        Math.pow(pa[0] - pb[0], 2) +
          Math.pow(pa[1] - pb[1], 2) +
          Math.pow(pa[2] - pb[2], 2)
      );
      if (dist < 6) {
        linePts.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]);
      }
    }
  }
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
  var lines = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x1ac4f0, transparent: true, opacity: 0.18 })
  );
  scene.add(lines);

  // ── Central wireframe core ──
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    new THREE.MeshStandardMaterial({
      color: 0x1ac4f0,
      emissive: 0x06a3d6,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true,
    })
  );
  core.position.set(0, 0, -2);
  scene.add(core);

  // ── Mouse & scroll tracking ──
  var mouseX = 0;
  var mouseY = 0;
  var scrollY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });
  window.addEventListener('scroll', function () {
    scrollY = window.scrollY || window.pageYOffset;
  });

  // ── Resize ──
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animation loop ──
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    var delta = clock.getDelta();

    // Star rotation
    stars.rotation.y = t * 0.02;
    stars.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Node group — mouse reactive + scroll drift
    var targetRotY = mouseX * 0.35 + t * 0.03 + scrollY * 0.0008;
    var targetRotX = -mouseY * 0.25 + scrollY * 0.0004;
    nodeGroup.rotation.y += (targetRotY - nodeGroup.rotation.y) * 0.05;
    nodeGroup.rotation.x += (targetRotX - nodeGroup.rotation.x) * 0.05;

    nodeMeshes.forEach(function (mesh, idx) {
      mesh.position.y += Math.sin(t * 0.8 + idx) * delta * 0.15;
      mesh.rotation.z += delta * 0.2;
    });

    // Lines slow rotation
    lines.rotation.y = t * 0.02;
    lines.rotation.z = Math.sin(t * 0.15) * 0.05;

    // Core pulse
    core.rotation.y += delta * 0.3;
    core.rotation.x += delta * 0.15;
    var coreScale = 1 + Math.sin(t * 1.5) * 0.05;
    core.scale.setScalar(coreScale);

    renderer.render(scene, camera);
  }
  animate();
})();

//Pages


var Pages = (function () {
  var HERO_IMG =
    'https://images.pexels.com/photos/7129700/pexels-photo-7129700.jpeg?auto=compress&cs=tinysrgb&w=1920';

  var icon = function (name) {
    var icons = {
      brain:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
      sparkles:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
      target:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      trending:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
      arrowRight:
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
      arrowLeft:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
      send:
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      loader:
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
      lightbulb:
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
      check:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      users:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      linkedin:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',
      github:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.66 1.05-.79 1.65S9.09 17.5 9.41 18c.32.5.66.5 1.09.5V22"/></svg>',
      mail:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-3.06 0L2 7"/></svg>',
    };
    return icons[name] || '';
  };

  function home() {
    var steps = [
      { icon: 'brain', title: 'Share Your Profile', desc: 'Tell us about your hobbies, interests, academic strengths, and soft skills — the things that make you, you.' },
      { icon: 'sparkles', title: 'AI Analysis', desc: 'Our engine maps your traits across thousands of career paths, weighing fit, demand, and growth potential.' },
      { icon: 'target', title: 'Personalized Matches', desc: 'Get a ranked list of careers that align with who you are — not just what scores you got.' },
      { icon: 'trending', title: 'Chart Your Path', desc: 'Explore each recommendation with insights into what the role involves and how to get there.' },
    ];

    var stepsHTML = steps
      .map(function (s, i) {
        return (
          '<div class="step-card glass-card">' +
          '<div class="glow"></div>' +
          '<div class="step-icon">' + icon(s.icon) + '</div>' +
          '<span class="step-num">0' + (i + 1) + '</span>' +
          '<h3>' + s.title + '</h3>' +
          '<p>' + s.desc + '</p>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<section class="hero">' +
      '<img class="hero-img" src="' + HERO_IMG + '" alt="A young student deep in thought, envisioning their future career" />' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-overlay-side"></div>' +
      '<div class="hero-content">' +
      '<p class="hero-eyebrow">AI-Powered Career Discovery</p>' +
      '<h2 class="hero-title">Find the Career That Fits<span class="accent-line">the Real You</span></h2>' +
      '<a href="#/try" class="btn-primary lg">Try Now ' + icon('arrowRight') + '</a>' +
      '</div>' +
      '</section>' +
      '<section class="how-section">' +
      '<div class="how-header">' +
      '<span class="eyebrow">' + icon('sparkles') + ' How It Works</span>' +
      '<h2 class="section-title">Your traits, mapped to thousands of careers</h2>' +
      '<p>CareerVerse turns the fuzzy question of "what should I do with my life?" into a clear, data-driven recommendation — visualized in real time as our engine connects your profile to the career universe.</p>' +
      '</div>' +
      '<div class="steps-grid">' + stepsHTML + '</div>' +
      '<div class="showcase">' +
      '<p class="showcase-eyebrow">See It In Motion</p>' +
      '<h3>The career universe, alive behind you</h3>' +
      '<p>Every glowing node you see in the background is a career cluster. Move your mouse and scroll — the network responds, just like our model responds to your inputs. That interactivity is the heart of CareerVerse.</p>' +
      '<a href="#/try" class="btn-primary">Start Your Assessment ' + icon('arrowRight') + '</a>' +
      '</div>' +
      '</section>'
    );
  }

  var ACADEMIC_OPTIONS = [
    'Mathematics', 'Science', 'English / Languages', 'History / Civics',
    'Computer Science', 'Art & Design', 'Business / Economics', 'Physical Education',
  ];

  var SOFT_SKILL_OPTIONS = [
    { key: 'leadership', label: 'Leadership' },
    { key: 'communication', label: 'Communication' },
    { key: 'teamwork', label: 'Teamwork' },
  ];

  function assessment() {
    var academicChips = ACADEMIC_OPTIONS
      .map(function (opt) {
        return '<button type="button" class="chip" data-academic="' + opt + '">' + opt + '</button>';
      })
      .join('');

    var traitSliders = ['problemSolving', 'creativity', 'socialInteraction']
      .map(function (key) {
        var label = key.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); });
        return (
          '<div class="slider-field">' +
          '<div class="slider-header"><span class="slider-label">' + label + '</span><span class="slider-value" data-val="' + key + '">5/10</span></div>' +
          '<input type="range" min="0" max="10" value="5" data-trait="' + key + '" />' +
          '</div>'
        );
      })
      .join('');

    var softSliders = SOFT_SKILL_OPTIONS
      .map(function (s) {
        return (
          '<div class="slider-field">' +
          '<div class="slider-header"><span class="slider-label">' + s.label + '</span><span class="slider-value" data-val="' + s.key + '">5/10</span></div>' +
          '<input type="range" min="0" max="10" value="5" data-soft="' + s.key + '" />' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="assessment-page">' +
      '<a href="#/" class="back-link">' + icon('arrowLeft') + ' Back to Home</a>' +
      '<div class="assessment-header">' +
      '<span class="eyebrow">' + icon('sparkles') + ' Career Assessment</span>' +
      '<h1 class="section-title">Tell us about yourself</h1>' +
      '<p>The more honest and specific you are, the better CareerVerse can match you. Fill in everything below and hit submit.</p>' +
      '</div>' +
      '<form id="assessment-form" class="assessment-form glass-card">' +
      '<div class="form-field">' +
      '<label class="field-label">Hobbies</label>' +
      '<p class="field-hint">What do you love doing in your free time? (e.g. painting, gaming, gardening)</p>' +
      '<textarea class="cv-input" id="hobbies" rows="3" required placeholder="e.g. I love playing chess, building model airplanes, and hiking on weekends..."></textarea>' +
      '</div>' +
      '<div class="form-field">' +
      '<label class="field-label">Interests</label>' +
      '<p class="field-hint">Topics or fields you\'re naturally curious about (e.g. space, fashion, psychology)</p>' +
      '<textarea class="cv-input" id="interests" rows="3" required placeholder="e.g. I\'m fascinated by how the brain works, renewable energy, and digital art..."></textarea>' +
      '</div>' +
      '<div class="form-field">' +
      '<label class="field-label">Academic Strengths</label>' +
      '<p class="field-hint">Pick the subjects where you shine</p>' +
      '<div class="chip-row" id="academic-chips">' + academicChips + '</div>' +
      '</div>' +
      '<div class="form-field">' +
      '<div class="sliders-grid three">' + traitSliders + '</div>' +
      '</div>' +
      '<div class="form-field">' +
      '<label class="field-label">Soft Skills</label>' +
      '<p class="field-hint">Rate yourself on each (0 = not me, 10 = totally me)</p>' +
      '<div class="sliders-grid three">' + softSliders + '</div>' +
      '</div>' +
      '<div class="form-submit">' +
      '<button type="submit" class="btn-primary lg" id="submit-btn">' + icon('send') + ' Submit</button>' +
      '</div>' +
      '</form>' +
      '<div id="loading" class="loading-state" style="display:none;">' +
      '<div class="spinner"></div>' +
      '<p>Mapping your profile to the career universe...</p>' +
      '</div>' +
      '<div id="results"></div>' +
      '</div>'
    );
  }

  var TEAM = [
    { name: 'Aalok Kumar', role: 'Idea And Planning', img: 'Assets/img/H.jpg', glow: 'brand' },
    { name: 'Aalok Kumar', role: 'AI powered Analysis',img: 'Assets/img/H.jpg', glow: 'accent' },
    { name: 'Aalok kumar', role: 'Page structure designing',img: 'Assets/img/H.jpg', glow: 'brand' },
    { name: 'Aalok kumar', role: 'Page styling and polishing',img: 'Assets/img/H.jpg', glow: 'accent' },
    { name: 'Aalok kumar', role: 'Website Responsiveness',img: 'Assets/img/H.jpg', glow: 'brand' },
  ];

  function about() {
    var teamCards = TEAM
      .map(function (m) {
        return (
          '<article class="team-card glass-card">' +
          '<div class="accent-glow ' + m.glow + '"></div>' +
          '<div class="team-photo">' +
          '<img src="' + m.img + '" alt="' + m.name + '" />' +
          '<div class="team-photo-overlay"></div>' +
          '</div>' +
          '<div class="team-info">' +
          '<h3>' + m.name + '</h3>' +
          '<p class="team-role">' + m.role + '</p>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    return (
      '<div class="about-page">' +
      '<div class="about-intro">' +
      '<span class="eyebrow">' + icon('users') + ' About Us</span>' +
      '<h1 class="section-title">The people behind CareerVerse</h1>' +
      '<p>We\'re a small team of educators, engineers, and dreamers who believe everyone deserves a career that fits who they truly are. CareerVerse was born from a simple idea: that your hobbies, interests, and strengths already hold the answer — you just need the right lens to see it.</p>' +
      '</div>' +
      '<div class="team-grid">' + teamCards + '</div>' +
      '<div class="mission-band">' +
      '<h2>Our mission</h2>' +
      '<p>To replace guesswork with clarity. Every young person should step into their future knowing it was chosen with insight, not accident — and that who they are was enough.</p>' +
      '</div>' +
      '</div>'
    );
  }

  return { home: home, assessment: assessment, about: about, icon: icon };
})();

//Career Suggestion

var CareerEngine = (function () {
  var CAREER_DB = [
    {
      name: 'Software Engineer / Developer',
      keywords: ['coding', 'programming', 'technology', 'computers', 'gaming', 'logic', 'math', 'puzzles', 'robots', 'apps'],
      skills: { problemSolving: 3, creativity: 1.5 },
      desc: 'You enjoy building things and solving logical challenges — a natural fit for creating software.',
    },
    {
      name: 'Data Scientist / Analyst',
      keywords: ['math', 'statistics', 'data', 'research', 'patterns', 'numbers', 'science', 'analysis'],
      skills: { problemSolving: 3, socialInteraction: -0.5 },
      desc: 'Your analytical mind and love for patterns make data-driven storytelling a strong match.',
    },
    {
      name: 'Graphic / UX Designer',
      keywords: ['art', 'drawing', 'design', 'creative', 'painting', 'aesthetics', 'fashion', 'photography', 'music'],
      skills: { creativity: 3, problemSolving: 1 },
      desc: 'Your creative flair and eye for aesthetics point toward designing experiences people love.',
    },
    {
      name: 'Marketing / Brand Strategist',
      keywords: ['social media', 'writing', 'business', 'marketing', 'communication', 'trends', 'advertising', 'content'],
      skills: { socialInteraction: 2.5, creativity: 2 },
      desc: 'You blend people-skills with creativity — ideal for shaping how brands connect with audiences.',
    },
    {
      name: 'Doctor / Healthcare Professional',
      keywords: ['biology', 'medicine', 'health', 'helping people', 'science', 'care', 'anatomy', 'hospital'],
      skills: { socialInteraction: 2, problemSolving: 2 },
      desc: 'Your desire to help others paired with strong science skills fits the medical field.',
    },
    {
      name: 'Civil / Mechanical Engineer',
      keywords: ['building', 'machines', 'physics', 'engineering', 'construction', 'mechanics', 'tools', 'cars'],
      skills: { problemSolving: 2.5, creativity: 1 },
      desc: 'You like how things work and solving real-world problems — engineering is your canvas.',
    },
    {
      name: 'Teacher / Educator',
      keywords: ['teaching', 'explaining', 'helping', 'mentoring', 'books', 'reading', 'knowledge', 'children'],
      skills: { socialInteraction: 3, problemSolving: 1 },
      desc: 'Your patience and communication skills make guiding others deeply rewarding.',
    },
    {
      name: 'Entrepreneur / Business Founder',
      keywords: ['business', 'startup', 'leadership', 'entrepreneur', 'money', 'ideas', 'innovation', 'sales'],
      skills: { socialInteraction: 2, creativity: 2, problemSolving: 1.5 },
      desc: 'Your drive, creativity, and people instincts are the recipe for building something of your own.',
    },
    {
      name: 'Psychologist / Counselor',
      keywords: ['psychology', 'people', 'listening', 'emotions', 'mental health', 'therapy', 'mind'],
      skills: { socialInteraction: 3, problemSolving: 1 },
      desc: "Your empathy and listening ability make supporting others' mental well-being a fulfilling path.",
    },
    {
      name: 'Financial Analyst / Accountant',
      keywords: ['math', 'finance', 'numbers', 'accounting', 'economics', 'money', 'business', 'statistics'],
      skills: { problemSolving: 2.5, socialInteraction: 0.5 },
      desc: 'Your comfort with numbers and structure suits the world of finance and analysis.',
    },
    {
      name: 'Journalist / Content Writer',
      keywords: ['writing', 'reading', 'news', 'storytelling', 'blogging', 'books', 'communication', 'research'],
      skills: { creativity: 2.5, socialInteraction: 1.5 },
      desc: 'Your love for words and curiosity about the world make storytelling a natural fit.',
    },
    {
      name: 'Research Scientist',
      keywords: ['science', 'research', 'experiments', 'biology', 'chemistry', 'physics', 'discovery', 'lab'],
      skills: { problemSolving: 3, creativity: 1.5 },
      desc: 'Your curiosity and analytical depth suit a life of discovery and experimentation.',
    },
    {
      name: 'Event / Project Manager',
      keywords: ['organizing', 'planning', 'events', 'coordination', 'leadership', 'management', 'teamwork'],
      skills: { socialInteraction: 2.5, problemSolving: 2 },
      desc: 'Your organizational talent and people skills keep complex projects moving smoothly.',
    },
    {
      name: 'Architect',
      keywords: ['design', 'architecture', 'building', 'art', 'drawing', 'spaces', 'creative', 'engineering'],
      skills: { creativity: 2.5, problemSolving: 2 },
      desc: 'You blend art and structure — architecture lets you design spaces people live and work in.',
    },
    {
      name: 'Lawyer / Legal Professional',
      keywords: ['law', 'debate', 'argument', 'justice', 'speaking', 'reading', 'civics', 'rights'],
      skills: { socialInteraction: 2, problemSolving: 2.5 },
      desc: 'Your reasoning and communication strengths align with advocacy and the legal field.',
    },
  ];

  function recommend(data) {
    var text = (data.hobbies + ' ' + data.interests + ' ' + data.academicStrengths.join(' ')).toLowerCase();
    var results = CAREER_DB.map(function (career) {
      var score = 0;
      var matchedKeywords = [];

      career.keywords.forEach(function (kw) {
        if (text.indexOf(kw) !== -1) {
          score += 2;
          matchedKeywords.push(kw);
        }
      });

      Object.keys(career.skills).forEach(function (skillKey) {
        var weight = career.skills[skillKey];
        var val = data[skillKey] !== undefined ? data[skillKey] : 0;
        score += (val / 10) * weight * 2;
      });

      data.academicStrengths.forEach(function (str) {
        var strLower = str.toLowerCase();
        if (career.keywords.some(function (kw) {
          return strLower.indexOf(kw) !== -1 || kw.indexOf(strLower) !== -1;
        })) {
          score += 1.5;
        }
      });

      var normalized = Math.min(Math.round((score / 18) * 100), 99);
      var why = matchedKeywords.length
        ? career.desc + ' Matched on: ' + matchedKeywords.slice(0, 4).join(', ') + '.'
        : career.desc;

      return { name: career.name, score: normalized, why: why };
    });

    return results
      .filter(function (r) {
        return r.score > 15;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 8);
  }

  return { recommend: recommend };
})();

//Main

(function () {
  var app = document.getElementById('app');
  var selectedAcademic = [];

  function setActiveNav(route) {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === route);
    });
  }

  function render(route) {
    window.scrollTo(0, 0);
    setActiveNav(route);

    switch (route) {
      case '/':
        app.innerHTML = Pages.home();
        break;
      case '/try':
        app.innerHTML = Pages.assessment();
        initAssessmentForm();
        break;
      case '/about':
        app.innerHTML = Pages.about();
        break;
      default:
        app.innerHTML = Pages.home();
    }
  }

  function getRoute() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash || hash === '/') return '/';
    return hash;
  }

  function router() {
    render(getRoute());
  }

  function initAssessmentForm() {
    selectedAcademic = [];

    // Academic chip toggles
    var chips = document.querySelectorAll('.chip[data-academic]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var val = chip.getAttribute('data-academic');
        var idx = selectedAcademic.indexOf(val);
        if (idx !== -1) {
          selectedAcademic.splice(idx, 1);
          chip.classList.remove('active');
          chip.innerHTML = val;
        } else {
          selectedAcademic.push(val);
          chip.classList.add('active');
          chip.innerHTML = Pages.icon('check') + val;
        }
      });
    });

    // Slider value displays
    document.querySelectorAll('input[type="range"]').forEach(function (slider) {
      slider.addEventListener('input', function () {
        var key = slider.getAttribute('data-trait') || slider.getAttribute('data-soft');
        var valEl = document.querySelector('[data-val="' + key + '"]');
        if (valEl) valEl.textContent = slider.value + '/10';
      });
    });

    // Form submit
    var form = document.getElementById('assessment-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit();
    });
  }

  function handleSubmit() {
    var data = {
      hobbies: document.getElementById('hobbies').value,
      interests: document.getElementById('interests').value,
      academicStrengths: selectedAcademic.slice(),
      problemSolving: 5,
      creativity: 5,
      socialInteraction: 5,
      leadership: 5,
      communication: 5,
      teamwork: 5,
    };

    document.querySelectorAll('input[type="range"][data-trait]').forEach(function (slider) {
      var key = slider.getAttribute('data-trait');
      data[key] = parseInt(slider.value, 10);
    });
    document.querySelectorAll('input[type="range"][data-soft]').forEach(function (slider) {
      var key = slider.getAttribute('data-soft');
      data[key] = parseInt(slider.value, 10);
    });

    var btn = document.getElementById('submit-btn');
    var loading = document.getElementById('loading');
    var resultsDiv = document.getElementById('results');

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...';
    loading.style.display = 'flex';
    resultsDiv.innerHTML = '';

    setTimeout(function () {
      var results = CareerEngine.recommend(data);
      loading.style.display = 'none';
      btn.disabled = false;
      btn.innerHTML = Pages.icon('send') + ' Submit';
      renderResults(results, resultsDiv);
    }, 1600);
  }

  function renderResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML =
        '<div class="results"><div class="results-card glass-card">' +
        '<p class="no-results">We couldn\'t find a strong match. Try adding more detail to your hobbies and interests and submit again.</p>' +
        '</div></div>';
      return;
    }

    var items = results
      .map(function (r, i) {
        return (
          '<li class="result-item">' +
          '<span class="result-rank">' + (i + 1) + '</span>' +
          '<div class="result-body">' +
          '<div class="result-top">' +
          '<h3 class="result-name">' + r.name + '</h3>' +
          '<span class="result-score">' + r.score + '% match</span>' +
          '</div>' +
          '<p class="result-why">' + r.why + '</p>' +
          '<div class="result-bar"><div class="result-bar-fill" style="width:' + r.score + '%"></div></div>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    container.innerHTML =
      '<div class="results">' +
      '<div class="results-card glass-card">' +
      '<div class="results-header">' +
      '<span class="results-icon">' + Pages.icon('lightbulb') + '</span>' +
      '<div><h2>Your Recommended Careers</h2><p>Ranked by how well they fit your unique profile.</p></div>' +
      '</div>' +
      '<ul class="results-list">' + items + '</ul>' +
      '</div>' +
      '</div>';
  }

  // Init
  document.getElementById('year').textContent = new Date().getFullYear();
  window.addEventListener('hashchange', router);
  router();
})();
