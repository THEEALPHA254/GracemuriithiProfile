class Typewriter {
    constructor(element, options) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = Object.assign({ loop: false }, options || {});
        this._tasks = [];
        this._stopped = false;
    }

    typeString(str) { this._tasks.push({ type: 'type', str }); return this; }
    deleteAll() { this._tasks.push({ type: 'clear' }); return this; }
    pauseFor(ms) { this._tasks.push({ type: 'pause', ms }); return this; }
    callFunction(fn) { this._tasks.push({ type: 'call', fn }); return this; }

    start() {
        this._stopped = false;
        const tasks = [...this._tasks];
        this._run(tasks, 0);
        return this;
    }

    stop() { this._stopped = true; return this; }

    _run(tasks, i) {
        if (this._stopped || i >= tasks.length) {
            if (!this._stopped && this.options.loop) {
                if (this.element) this.element.innerHTML = '';
                this._run(tasks, 0);
            }
            return;
        }
        const t = tasks[i];
        const next = () => this._run(tasks, i + 1);
        if (t.type === 'type') {
            if (this.element) this.element.innerHTML += t.str + '<span class="Typewriter__cursor">|</span>';
            next();
        } else if (t.type === 'clear') {
            if (this.element) this.element.innerHTML = '';
            next();
        } else if (t.type === 'pause') {
            setTimeout(next, t.ms);
        } else if (t.type === 'call') {
            t.fn();
            next();
        }
    }
}
