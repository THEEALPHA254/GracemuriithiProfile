(function () {
    'use strict';

    const FLOW_ALIASES = { portfolio: 'projects' };

    const EMAILJS_PUBLIC_KEY  = 'mJjAw_7wji1UoyI-5';
    const EMAILJS_SERVICE_ID  = 'service_3wa4h98';
    const EMAILJS_TEMPLATE_ID = 'template_wtfm9t1';

    let chatStarted = false;
    let projectsShown = 0;
    let isProcessing = false;

    const preloader      = document.getElementById('preloader');
    const introScreen    = document.getElementById('intro-screen');
    const chatWindow     = document.getElementById('chat-window');
    const chatInput      = document.getElementById('chat-input');
    const sendButton     = document.getElementById('send-button');
    const btnMenuToggle  = document.getElementById('btn-menu-toggle');
    const primaryNav     = document.getElementById('primary-nav');
    const navWrapper     = document.getElementById('input-nav-wrapper');
    const modal          = document.getElementById('master-modal');
    const modalContent   = document.getElementById('modal-content-area');
    const checkbox       = document.getElementById('checkbox');
    const chatAvatarImg  = document.getElementById('chat-avatar');

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        initPreloader();
        initDarkMode();
        initInput();
        initNavButtons();
        initIntroButtons();
        initMenuToggle();
        initModal();
    }

    /* ── Preloader ── */

    function initPreloader() {
        setTimeout(function () {
            preloader.classList.add('preloaded');
            setTimeout(function () { preloader.style.display = 'none'; }, 1200);
        }, 900);
    }

    /* ── Dark mode ── */

    function initDarkMode() {
        checkbox.checked = document.body.classList.contains('dark');
        checkbox.addEventListener('change', function () {
            document.body.classList.toggle('dark', checkbox.checked);
        });
    }

    /* ── Chat input ── */

    function initInput() {
        chatInput.addEventListener('input', function () {
            sendButton.disabled = chatInput.value.trim() === '';
        });

        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey && !sendButton.disabled) {
                e.preventDefault();
                submitUserText(chatInput.value.trim());
            }
        });

        sendButton.addEventListener('click', function () {
            if (!sendButton.disabled) submitUserText(chatInput.value.trim());
        });
    }

    function submitUserText(text) {
        if (!text || isProcessing) return;
        startChat();
        chatInput.value = '';
        sendButton.disabled = true;
        appendUserMessage(text);
        const flow = getFlowByTrigger(text);
        deliverResponse(flow);
    }

    /* ── Navigation buttons ── */

    function initNavButtons() {
        document.querySelectorAll('.btn-primary-nav[data-flow]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                closeMenu();
                const flowId = btn.dataset.flow;
                if (flowId === 'projects') projectsShown = 0;
                startChat();
                const flow = getFlowData(flowId);
                if (flow) deliverResponse(flow);
            });
        });
    }

    /* ── Intro screen buttons ── */

    function initIntroButtons() {
        document.querySelectorAll('#intro-options-target [data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const flowId = FLOW_ALIASES[btn.dataset.action] || btn.dataset.action;
                if (flowId === 'projects') projectsShown = 0;
                startChat();
                const flow = getFlowData(flowId);
                if (flow) deliverResponse(flow);
            });
        });
    }

    /* ── Mobile menu ── */

    function initMenuToggle() {
        if (!btnMenuToggle) return;
        btnMenuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            document.body.classList.toggle('open-menu');
            primaryNav.classList.toggle('menu-active');
        });
        document.addEventListener('click', function (e) {
            if (!primaryNav.contains(e.target) && e.target !== btnMenuToggle) closeMenu();
        });
    }

    function closeMenu() {
        document.body.classList.remove('open-menu');
        if (primaryNav) primaryNav.classList.remove('menu-active');
    }

    /* ── Modal ── */

    function initModal() {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeMasterModal();
        });
    }

    window.closeMasterModal = function () {
        modal.classList.remove('active', 'modal-contact');
        setTimeout(function () { modalContent.innerHTML = ''; }, 300);
    };

    /* ── Start chat (transition from intro) ── */

    function startChat() {
        if (chatStarted) return;
        chatStarted = true;
        introScreen.style.transition = 'opacity 0.4s ease, visibility 0.4s ease';
        introScreen.classList.add('fade-out');
        if (chatAvatarImg) chatAvatarImg.style.display = 'block';
    }

    /* ── Flow lookup ── */

    function getFlowData(flowId) {
        return document.querySelector('[data-flow-id="' + flowId + '"]') ||
               document.getElementById('flow-' + flowId);
    }

    function getFlowId(flow) {
        return flow.dataset.flowId || (flow.id ? flow.id.replace(/^flow-/, '') : 'unknown');
    }

    function getFlowByTrigger(text) {
        var lower = text.toLowerCase().trim();
        var best = null;
        var bestLen = 0;
        document.querySelectorAll('[data-triggers]').forEach(function (flow) {
            var triggers = flow.dataset.triggers.split(',').map(function (t) { return t.trim().toLowerCase(); });
            triggers.forEach(function (trigger) {
                if (lower.includes(trigger) && trigger.length > bestLen) {
                    best = flow;
                    bestLen = trigger.length;
                }
            });
        });
        return best || getFlowData('error');
    }

    /* ── Response delivery ── */

    function deliverResponse(flow) {
        if (isProcessing) return;
        isProcessing = true;
        lockInput();

        var typingRow = appendTypingIndicator();
        var delay = 700 + Math.random() * 300;

        setTimeout(function () {
            typingRow.remove();
            renderFlow(flow);
            unlockInput();
            isProcessing = false;
        }, delay);
    }

    /* ── Flow rendering ── */

    function renderFlow(flow) {
        var id = getFlowId(flow);
        if (id === 'projects')      renderProjectsFlow(flow);
        else if (id === 'clients')  renderClientsFlow(flow);
        else if (id === 'contact')  renderContactFlow(flow);
        else                        renderGenericFlow(flow);
    }

    function calcAge(year, month, day) {
        var today = new Date();
        var age = today.getFullYear() - year;
        if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
        return age;
    }

    function renderGenericFlow(flow) {
        var clone = flow.cloneNode(true);
        var opts = clone.querySelector('ul.options');
        if (opts) opts.remove();

        var html = clone.innerHTML.replace(/\{\{age\}\}/g, calcAge(2004, 3, 21));
        appendAiMessage(html);

        var origOpts = flow.querySelector('ul.options');
        if (origOpts) appendContextualOptions(origOpts);
        scrollDown();
    }

    function renderContactFlow(flow) {
        var wrapper = document.createElement('div');
        wrapper.className = 'contact-section-wrapper';

        var intro = flow.querySelector('p.intro');
        if (intro) {
            var p = document.createElement('p');
            p.innerHTML = intro.innerHTML;
            wrapper.appendChild(p);
        }

        flow.querySelectorAll('.contact-row').forEach(function (row) {
            var value = row.textContent.trim();
            var isPhone = row.dataset.icon.includes('whatsapp') || row.dataset.icon.includes('phone');
            var a = document.createElement('a');
            a.className = 'contact-direct-row';
            a.href = isPhone ? 'tel:' + value.replace(/\s/g, '') : 'mailto:' + value;
            a.innerHTML = '<i class="' + row.dataset.icon + '"></i>' +
                          '<span class="type-target">' + row.dataset.label + '</span> ' + value;
            wrapper.appendChild(a);
        });

        var socialItems = flow.querySelectorAll('.social-item');
        if (socialItems.length) {
            var row = document.createElement('div');
            row.className = 'contact-social-row';
            socialItems.forEach(function (item, idx) {
                var a = document.createElement('a');
                a.href = item.dataset.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'contact-social-icon fade-out-init';
                var i = document.createElement('i');
                i.className = item.dataset.icon + ' ' + (item.dataset.class || '');
                a.appendChild(i);
                row.appendChild(a);
                setTimeout(function () { a.classList.add('visible'); }, 120 + idx * 80);
            });
            wrapper.appendChild(row);
        }

        var msg = appendAiMessage('');
        msg.querySelector('.rich-paragraph').appendChild(wrapper);

        var opts = flow.querySelector('ul.options');
        if (opts) appendContextualOptions(opts);
        scrollDown();
    }

    function renderClientsFlow(flow) {
        var wrapper = document.createElement('div');

        var intro = flow.querySelector('p.intro');
        if (intro) {
            var p = document.createElement('p');
            p.innerHTML = intro.innerHTML;
            wrapper.appendChild(p);
        }

        var logosWrapper = document.createElement('div');
        logosWrapper.className = 'client-logos-wrapper';

        flow.querySelectorAll('.client-item').forEach(function (item, idx) {
            var logoItem = document.createElement('div');
            logoItem.className = 'client-logo-item animated-logo';
            logoItem.style.animationDelay = (idx * 0.1) + 's';
            var img = document.createElement('img');
            img.src = item.dataset.logo;
            img.alt = item.dataset.name || 'Client';
            logoItem.appendChild(img);
            logosWrapper.appendChild(logoItem);
        });

        wrapper.appendChild(logosWrapper);

        var msg = appendAiMessage('');
        msg.querySelector('.rich-paragraph').appendChild(wrapper);

        var opts = flow.querySelector('ul.options');
        if (opts) appendContextualOptions(opts);
        scrollDown();
    }

    function renderProjectsFlow(flow) {
        var projects = Array.from(document.querySelectorAll('.project-item'));

        if (projectsShown === 0) {
            var intro = flow.querySelector('p.intro');
            if (intro) appendAiMessage('<p>' + intro.innerHTML + '</p>');
        }

        if (projectsShown >= projects.length) {
            var finalBtns = flow.querySelector('.project-buttons .final');
            if (finalBtns) appendContextualOptions(finalBtns);
            scrollDown();
            return;
        }

        var projectEl = projects[projectsShown];
        chatWindow.appendChild(buildProjectCard(projectEl));
        projectsShown++;

        var optDiv = document.createElement('div');
        optDiv.className = 'contextual-options';

        if (projectsShown < projects.length) {
            var nextBtn = buildButton('Show Next Project', null, null, function () {
                optDiv.remove();
                renderProjectsFlow(flow);
            });
            optDiv.appendChild(nextBtn);

            var globalBtns = flow.querySelector('.project-buttons .global');
            if (globalBtns) {
                globalBtns.querySelectorAll('li').forEach(function (li) {
                    optDiv.appendChild(buildButtonFromLi(li));
                });
            }
        } else {
            var finalList = flow.querySelector('.project-buttons .final');
            if (finalList) {
                finalList.querySelectorAll('li').forEach(function (li) {
                    optDiv.appendChild(buildButtonFromLi(li));
                });
            }
        }

        chatWindow.appendChild(optDiv);
        scrollDown();
    }

    function buildProjectCard(projectEl) {
        var mediaType  = projectEl.dataset.media;
        var title      = projectEl.dataset.title;
        var link       = projectEl.dataset.link;
        var image      = projectEl.dataset.image;
        var summaryEl  = projectEl.querySelector('p.summary');
        var summary    = summaryEl ? summaryEl.textContent : '';

        var wrapper = document.createElement('div');
        wrapper.className = 'ai-message';

        var avatar = buildAvatar();
        wrapper.appendChild(avatar);

        var card = document.createElement('div');
        card.className = 'single-project-card project-fade-in';

        var projectCard = document.createElement('div');
        projectCard.className = 'project-card';

        var mediaWrapper = document.createElement('div');
        var clickable = mediaType !== 'image';
        mediaWrapper.className = 'project-media-wrapper' + (clickable ? '' : ' project-image');

        var img = document.createElement('img');
        img.src = image;
        img.alt = title;
        mediaWrapper.appendChild(img);

        if (clickable) {
            var iconClass = (mediaType === 'youtube' || mediaType === 'video')
                ? 'fa-solid fa-play'
                : 'fa-solid fa-expand';
            var overlay = document.createElement('div');
            overlay.className = 'media-icon-overlay';
            overlay.innerHTML = '<i class="' + iconClass + '"></i>';
            mediaWrapper.appendChild(overlay);
            mediaWrapper.addEventListener('click', function () { openProjectMedia(projectEl); });
        }

        var details = document.createElement('div');
        details.className = 'details';

        var h4 = document.createElement('h4');
        h4.textContent = title;
        details.appendChild(h4);

        var pSum = document.createElement('p');
        pSum.textContent = summary;
        details.appendChild(pSum);

        if (link) {
            var a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'preview-link';
            a.innerHTML = 'View Project <i class="fa-solid fa-arrow-right"></i>';
            details.appendChild(a);
        }

        projectCard.appendChild(mediaWrapper);
        projectCard.appendChild(details);
        card.appendChild(projectCard);
        wrapper.appendChild(card);
        return wrapper;
    }

    function openProjectMedia(projectEl) {
        var mediaType = projectEl.dataset.media;
        modalContent.innerHTML = '';
        modal.className = 'modal-overlay';

        if (mediaType === 'youtube') {
            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + projectEl.dataset.youtubeId + '?autoplay=1';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            modalContent.appendChild(iframe);

        } else if (mediaType === 'video') {
            var video = document.createElement('video');
            video.src = projectEl.dataset.videoUrl;
            video.controls = true;
            video.autoplay = true;
            video.style.borderRadius = '30px';
            modalContent.appendChild(video);

        } else if (mediaType === 'gallery') {
            var galleryImgs = Array.from(projectEl.querySelectorAll('.gallery-urls img'));
            var slider = document.createElement('div');
            slider.className = 'modal-slider';

            var track = document.createElement('div');
            track.className = 'slider-track';

            galleryImgs.forEach(function (src) {
                var item = document.createElement('div');
                item.className = 'slider-item';
                var sImg = document.createElement('img');
                sImg.src = src.src;
                sImg.className = 'slider-img';
                item.appendChild(sImg);
                track.appendChild(item);
            });

            slider.appendChild(track);

            if (galleryImgs.length > 1) {
                var current = 0;

                var counter = document.createElement('div');
                counter.className = 'modal-counter';
                counter.textContent = '1 / ' + galleryImgs.length;

                function goTo(n) {
                    current = (n + galleryImgs.length) % galleryImgs.length;
                    track.style.transform = 'translateX(-' + (current * 100) + '%)';
                    counter.textContent = (current + 1) + ' / ' + galleryImgs.length;
                }

                var prev = document.createElement('button');
                prev.className = 'slider-nav prev-slide';
                prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
                prev.addEventListener('click', function () { goTo(current - 1); });

                var next = document.createElement('button');
                next.className = 'slider-nav next-slide';
                next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                next.addEventListener('click', function () { goTo(current + 1); });

                var startX = 0;
                slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; });
                slider.addEventListener('touchend', function (e) {
                    var diff = startX - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
                });

                slider.appendChild(prev);
                slider.appendChild(next);
                slider.appendChild(counter);
            }

            modalContent.appendChild(slider);
        }

        modal.classList.add('active');
    }

    function openContactForm() {
        modalContent.innerHTML =
            '<div class="contact-form-wrapper">' +
            '<h3>Send Me a Message</h3>' +
            '<form class="ajax-contact-form" id="contact-form">' +
            '<input type="text" name="name" placeholder="Your Name" required>' +
            '<input type="email" name="email" placeholder="Your Email" required>' +
            '<textarea name="message" placeholder="Your Message" required></textarea>' +
            '<button type="submit" class="btn btn-primary">' +
            '<span class="button-content"><span>Send Message</span></span></button>' +
            '</form></div>';

        modal.classList.add('active', 'modal-contact');

        document.getElementById('contact-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.querySelector('span span').textContent = 'Sending…';

            var nameVal    = form.elements['name'].value;
            var emailVal   = form.elements['email'].value;
            var messageVal = form.elements['message'].value;
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                name:    nameVal,
                email:   emailVal,
                message: messageVal,
                title:   'New message from ' + nameVal,
                time:    new Date().toLocaleString()
            }).then(function () {
                window.closeMasterModal();
                var successFlow = getFlowData('msg_success');
                if (successFlow) deliverResponse(successFlow);
            }, function () {
                submitBtn.disabled = false;
                submitBtn.querySelector('span span').textContent = 'Send Message';
                alert('Something went wrong. Please try again or email me directly.');
            });
        });
    }

    /* ── DOM helpers ── */

    function appendAiMessage(html) {
        var row = document.createElement('div');
        row.className = 'ai-message';

        var avatar = buildAvatar();
        var bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        var rich = document.createElement('div');
        rich.className = 'rich-paragraph';
        rich.innerHTML = html;

        bubble.appendChild(rich);
        row.appendChild(avatar);
        row.appendChild(bubble);
        chatWindow.appendChild(row);
        return row;
    }

    function appendUserMessage(text) {
        var row = document.createElement('div');
        row.className = 'message-row user-message';
        var bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        row.appendChild(bubble);
        chatWindow.appendChild(row);
        scrollDown();
    }

    function appendTypingIndicator() {
        var row = document.createElement('div');
        row.className = 'ai-message typing-active';
        var avatar = buildAvatar();
        var bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        var dot = document.createElement('div');
        dot.className = 'typing-indicator';
        bubble.appendChild(dot);
        row.appendChild(avatar);
        row.appendChild(bubble);
        chatWindow.appendChild(row);
        scrollDown();
        return row;
    }

    function appendContextualOptions(optionsList) {
        var div = document.createElement('div');
        div.className = 'contextual-options';
        optionsList.querySelectorAll('li').forEach(function (li) {
            div.appendChild(buildButtonFromLi(li));
        });
        chatWindow.appendChild(div);
    }

    function buildButtonFromLi(li) {
        return buildButton(
            li.textContent.trim(),
            li.dataset.action || null,
            li.dataset.link || null,
            null,
            li.dataset.class === 'btn-secondary'
        );
    }

    function buildButton(text, action, link, onClick, secondary) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-primary' + (secondary ? ' btn-secondary' : '');
        btn.innerHTML = '<span class="button-content"><span>' + text + '</span></span>';

        btn.addEventListener('click', function () {
            if (onClick) {
                onClick();
            } else if (action === 'open_contact_form') {
                openContactForm();
            } else if (action) {
                var flowId = FLOW_ALIASES[action] || action;
                if (flowId === 'projects') projectsShown = 0;
                var flow = getFlowData(flowId);
                if (flow) { startChat(); deliverResponse(flow); }
            } else if (link) {
                window.open(link, '_blank');
            }
        });

        return btn;
    }

    function buildAvatar() {
        var img = document.createElement('img');
        img.className = 'chat-avatar';
        img.src = 'img/chat-avatar.png';
        img.alt = 'Avatar';
        return img;
    }

    /* ── Input lock/unlock ── */

    function lockInput() {
        chatInput.disabled = true;
        sendButton.disabled = true;
        if (navWrapper) navWrapper.classList.add('disabled');
        document.querySelectorAll('.btn-primary-nav').forEach(function (b) { b.classList.add('disabled'); });
    }

    function unlockInput() {
        chatInput.disabled = false;
        if (navWrapper) navWrapper.classList.remove('disabled');
        document.querySelectorAll('.btn-primary-nav').forEach(function (b) { b.classList.remove('disabled'); });
        chatInput.focus();
    }

    /* ── Scroll ── */

    function scrollDown() {
        setTimeout(function () {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 60);
    }
})();
