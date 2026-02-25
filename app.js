const { createApp, ref } = Vue;

createApp({
  setup() {
    // 显示值
    const display = ref('0');
    // 前一个值
    const previousValue = ref(null);
    // 当前操作符
    const operator = ref(null);
    // 是否等待新值
    const waitingForNewValue = ref(false);
    // 表达式
    const expression = ref('');

    // 输入数字
    const inputNumber = (num) => {
      if (waitingForNewValue.value) {
        display.value = num === '.' ? '0.' : num;
        waitingForNewValue.value = false;
      } else {
        if (num === '.' && display.value.includes('.')) return;
        if (display.value.replace(/[^0-9]/g, '').length >= 16) return;
        display.value = display.value === '0' && num !== '.' ? num : display.value + num;
      }
    };

    // 输入操作符
    const inputOperator = (op) => {
      const currentValue = parseFloat(display.value);

      if (operator.value && waitingForNewValue.value) {
        operator.value = op;
        expression.value = expression.value.slice(0, -1) + getOperatorSymbol(op);
        return;
      }

      if (previousValue.value === null) {
        previousValue.value = currentValue;
      } else if (operator.value) {
        const result = calculate(previousValue.value, currentValue, operator.value);
        display.value = formatResult(result);
        previousValue.value = result;
      }

      operator.value = op;
      waitingForNewValue.value = true;
      expression.value = `${formatNumber(previousValue.value)} ${getOperatorSymbol(op)}`;
    };

    // 计算
    const calculate = (a, b, op) => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b !== 0 ? a / b : NaN;
        default: return b;
      }
    };

    // 获取操作符符号
    const getOperatorSymbol = (op) => {
      const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      return symbols[op] || op;
    };

    // 格式化结果
    const formatResult = (result) => {
      if (isNaN(result)) return '错误';
      if (!isFinite(result)) return '除数不能为零';
      if (Math.abs(result) > 1e16) return result.toExponential(10);
      const resultStr = result.toString();
      if (resultStr.length > 16) {
        if (Number.isInteger(result)) return result.toExponential(10);
        return parseFloat(result.toPrecision(15)).toString();
      }
      return resultStr;
    };

    // 格式化数字
    const formatNumber = (num) => {
      if (isNaN(num)) return '错误';
      return num.toLocaleString('zh-CN', { maximumFractionDigits: 10 });
    };

    // 等于
    const equals = () => {
      if (operator.value === null || previousValue.value === null) return;
      const currentValue = parseFloat(display.value);
      const result = calculate(previousValue.value, currentValue, operator.value);
      expression.value = `${formatNumber(previousValue.value)} ${getOperatorSymbol(operator.value)} ${formatNumber(currentValue)} =`;
      display.value = formatResult(result);
      previousValue.value = null;
      operator.value = null;
      waitingForNewValue.value = true;
    };

    // 清除当前
    const clearEntry = () => {
      display.value = '0';
    };

    // 清除全部
    const clearAll = () => {
      display.value = '0';
      previousValue.value = null;
      operator.value = null;
      waitingForNewValue.value = false;
      expression.value = '';
    };

    // 退格
    const backspace = () => {
      if (waitingForNewValue.value) return;
      if (display.value.length > 1) {
        display.value = display.value.slice(0, -1);
      } else {
        display.value = '0';
      }
    };

    // 百分比
    const percentage = () => {
      const currentValue = parseFloat(display.value);
      display.value = formatResult(currentValue / 100);
    };

    // 倒数
    const reciprocal = () => {
      const currentValue = parseFloat(display.value);
      if (currentValue === 0) {
        display.value = '除数不能为零';
        waitingForNewValue.value = true;
        return;
      }
      expression.value = `1/(${display.value})`;
      display.value = formatResult(1 / currentValue);
      waitingForNewValue.value = true;
    };

    // 平方
    const square = () => {
      const currentValue = parseFloat(display.value);
      expression.value = `sqr(${display.value})`;
      display.value = formatResult(currentValue * currentValue);
      waitingForNewValue.value = true;
    };

    // 平方根
    const sqrt = () => {
      const currentValue = parseFloat(display.value);
      if (currentValue < 0) {
        display.value = '输入无效';
        waitingForNewValue.value = true;
        return;
      }
      expression.value = `√(${display.value})`;
      display.value = formatResult(Math.sqrt(currentValue));
      waitingForNewValue.value = true;
    };

    // 处理点击
    const handleClick = (value, type) => {
      switch (type) {
        case 'number':
          inputNumber(value);
          break;
        case 'operator':
          if (value === '=') equals();
          else inputOperator(value);
          break;
        case 'function':
          switch (value) {
            case 'CE': clearEntry(); break;
            case 'C': clearAll(); break;
            case 'backspace': backspace(); break;
            case '%': percentage(); break;
            case 'reciprocal': reciprocal(); break;
            case 'square': square(); break;
            case 'sqrt': sqrt(); break;
          }
          break;
      }
    };

    // 键盘支持
    const handleKeydown = (e) => {
      const key = e.key;
      if (/^[0-9.]$/.test(key)) inputNumber(key);
      else if (['+', '-', '*', '/'].includes(key)) inputOperator(key);
      else if (key === 'Enter' || key === '=') { e.preventDefault(); equals(); }
      else if (key === 'Escape') clearAll();
      else if (key === 'Backspace') backspace();
      else if (key === '%') percentage();
    };

    Vue.onMounted(() => document.addEventListener('keydown', handleKeydown));
    Vue.onUnmounted(() => document.removeEventListener('keydown', handleKeydown));

    return { display, expression, handleClick };
  },

  template: `
    <div class="calculator">
      <div class="title-bar">
        <span class="title">计算器</span>
        <div class="window-controls">
          <button class="minimize"></button>
          <button class="maximize"></button>
          <button class="close"></button>
        </div>
      </div>
      <div class="menu-bar">
        <button class="menu-item">
          <span class="hamburger"></span>
          <span>标准</span>
        </button>
      </div>
      <div class="display">
        <div class="history">{{ expression }}</div>
        <div class="current">{{ display }}</div>
      </div>
      <div class="buttons">
        <button class="btn function" @click="handleClick('%', 'function')">%</button>
        <button class="btn function" @click="handleClick('CE', 'function')">CE</button>
        <button class="btn function" @click="handleClick('C', 'function')">C</button>
        <button class="btn function" @click="handleClick('backspace', 'function')">⌫</button>
        <button class="btn function" @click="handleClick('reciprocal', 'function')">¹/ₓ</button>
        <button class="btn function" @click="handleClick('square', 'function')">x²</button>
        <button class="btn function" @click="handleClick('sqrt', 'function')">²√x</button>
        <button class="btn operator" @click="handleClick('/', 'operator')">÷</button>
        <button class="btn number" @click="handleClick('7', 'number')">7</button>
        <button class="btn number" @click="handleClick('8', 'number')">8</button>
        <button class="btn number" @click="handleClick('9', 'number')">9</button>
        <button class="btn operator" @click="handleClick('*', 'operator')">×</button>
        <button class="btn number" @click="handleClick('4', 'number')">4</button>
        <button class="btn number" @click="handleClick('5', 'number')">5</button>
        <button class="btn number" @click="handleClick('6', 'number')">6</button>
        <button class="btn operator" @click="handleClick('-', 'operator')">−</button>
        <button class="btn number" @click="handleClick('1', 'number')">1</button>
        <button class="btn number" @click="handleClick('2', 'number')">2</button>
        <button class="btn number" @click="handleClick('3', 'number')">3</button>
        <button class="btn operator" @click="handleClick('+', 'operator')">+</button>
        <button class="btn number zero" @click="handleClick('0', 'number')">0</button>
        <button class="btn number" @click="handleClick('.', 'number')">.</button>
        <button class="btn operator equals" @click="handleClick('=', 'operator')">=</button>
      </div>
    </div>
  `
}).mount('#app');
