class YamlKeyReplacer {
    constructor() {
        this.files = new Map();
        this.modifiedFiles = new Map();
        this.selectedFiles = new Set();
        this.detectedKeys = new Set();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        console.log('初始化事件监听器...');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const previewBtn = document.getElementById('previewBtn');
        const saveBtn = document.getElementById('saveBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const detectBtn = document.getElementById('detectBtn');

        // 文件上传处理 - 简化事件处理
        const uploadBtn = document.getElementById('uploadBtn');
        
        console.log('DOM元素检查:');
        console.log('uploadBtn:', uploadBtn);
        console.log('fileInput:', fileInput);
        console.log('uploadArea:', uploadArea);
        
        // 上传按钮点击事件
        if (uploadBtn && fileInput) {
            console.log('绑定上传按钮点击事件');
            uploadBtn.addEventListener('click', (e) => {
                console.log('选择文件按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                console.log('触发fileInput.click()');
                fileInput.click();
            });
        } else {
            console.error('上传按钮或文件输入元素未找到');
            console.error('uploadBtn存在:', !!uploadBtn);
            console.error('fileInput存在:', !!fileInput);
        }
        
        // 上传区域点击事件（排除按钮区域）
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', (e) => {
                console.log('上传区域被点击');
                // 如果点击的不是按钮，则触发文件选择
                if (e.target !== uploadBtn && !uploadBtn.contains(e.target)) {
                    fileInput.click();
                }
            });
        }
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                console.log('文件拖拽上传:', e.dataTransfer.files);
                this.handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('文件选择变化:', e.target.files);
                if (e.target.files && e.target.files.length > 0) {
                    console.log(`选择了 ${e.target.files.length} 个文件`);
                    this.handleFiles(e.target.files);
                    // 清空input值，允许重复选择相同文件
                    e.target.value = '';
                }
            });
        }

        // 按钮事件
      
        previewBtn.addEventListener('click', () => this.previewChanges());
        saveBtn.addEventListener('click', () => this.saveFiles());
        
        // 文件选择控制
        const selectAllBtn = document.getElementById('selectAllBtn');
        const deselectAllBtn = document.getElementById('deselectAllBtn');
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllFiles());
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => this.deselectAllFiles());


        // 输入验证
        const oldKeyPath = document.getElementById('oldKeyPath');
        const newKeyPath = document.getElementById('newKeyPath');
        
        [oldKeyPath, newKeyPath].forEach(input => {
            input.addEventListener('input', () => this.validateInputs());
            input.addEventListener('input', () => this.checkKeyExistence());
        });

        // Tab 切换和key选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
            if (e.target.classList.contains('key-item')) {
                this.selectDetectedKey(e.target.textContent);
            }
            if (e.target.classList.contains('file-item') || e.target.closest('.file-item')) {
                const fileItem = e.target.classList.contains('file-item') ? e.target : e.target.closest('.file-item');
                if (fileItem && fileItem.dataset.filename && 
                    !e.target.classList.contains('remove-file') && 
                    !e.target.classList.contains('file-checkbox') && 
                    !e.target.classList.contains('preview-file-btn') &&
                    !e.target.closest('.file-info')) {
                    this.toggleFileSelection(fileItem.dataset.filename);
                }
            }
        });
    }

    selectAllFiles() {
        this.files.forEach((fileData, fileName) => {
            this.selectedFiles.add(fileName);
        });
        this.updateFilesDisplay();
        this.updateSelectedCount();
        this.validateInputs();
    }

    deselectAllFiles() {
        this.selectedFiles.clear();
        this.updateFilesDisplay();
        this.updateSelectedCount();
        this.validateInputs();
    }

    toggleFileSelection(fileName) {
        if (this.selectedFiles.has(fileName)) {
            this.selectedFiles.delete(fileName);
        } else {
            this.selectedFiles.add(fileName);
        }
        this.updateFilesDisplay();
        this.updateSelectedCount();
        this.validateInputs();
    }

    updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = this.selectedFiles.size;
        }
    }

    getSelectedFiles() {
        const selected = new Map();
        this.selectedFiles.forEach(fileName => {
            if (this.files.has(fileName)) {
                selected.set(fileName, this.files.get(fileName));
            }
        });
        return selected;
    }

    validateInputs() {
        const oldKeyPath = this.getOldKeyPath();
        const newKeyPath = this.getNewKeyPath();
        const previewBtn = document.getElementById('previewBtn');
        
        const hasSelectedFiles = this.selectedFiles.size > 0;
        previewBtn.disabled = !oldKeyPath || !newKeyPath || oldKeyPath === newKeyPath || !hasSelectedFiles;
    }


    async detectKeys() {
        const selectedFiles = this.getSelectedFiles();
        if (selectedFiles.size === 0) {
            alert('请先选择要检测的文件');
            return;
        }

        this.showProgress('正在检测所有key...', 0);
        this.detectedKeys.clear();
        
        let processedCount = 0;
        for (const [fileName, fileData] of selectedFiles) {
            try {
                const yamlObj = jsyaml.load(fileData.originalContent);
                this.extractAllKeys(yamlObj);
                
                processedCount++;
                const progress = (processedCount / selectedFiles.size) * 100;
                this.showProgress(`正在检测key... (${processedCount}/${selectedFiles.size})`, progress);
            } catch (error) {
                console.error(`解析文件 ${fileName} 失败:`, error);
            }
        }
        
        this.hideProgress();
        this.displayDetectedKeys();
    }

    extractAllKeys(obj, prefix = '') {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }
        
        for (const key in obj) {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            this.detectedKeys.add(currentPath);
            
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.extractAllKeys(obj[key], currentPath);
            }
        }
    }

    displayDetectedKeys() {
        const detectedKeysDiv = document.getElementById('detectedKeys');
        const keysList = document.getElementById('keysList');
        
        if (this.detectedKeys.size === 0) {
            detectedKeysDiv.style.display = 'none';
            return;
        }
        
        keysList.innerHTML = '';
        const sortedKeys = Array.from(this.detectedKeys).sort();
        
        sortedKeys.forEach(keyPath => {
            const keyItem = document.createElement('div');
            keyItem.className = 'key-item';
            keyItem.textContent = keyPath;
            keysList.appendChild(keyItem);
        });
        
        detectedKeysDiv.style.display = 'block';
    }

    selectDetectedKey(keyPath) {
        document.getElementById('oldKeyPath').value = keyPath;
        
        // 更新选中状态
        document.querySelectorAll('.key-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        this.checkKeyExistence();
        this.validateInputs();
    }


    async checkKeyExistence() {
        const selectedFiles = this.getSelectedFiles();
        if (selectedFiles.size === 0) return;
        
        const oldKeyPath = this.getOldKeyPath();
        if (!oldKeyPath) return;
        
        const statusElement = document.getElementById('oldKeyStatus');
            
        statusElement.className = 'key-status checking';
        statusElement.textContent = '正在检查key是否存在...';
        
        let foundCount = 0;
        let totalFiles = 0;
        const foundFiles = []; // 记录找到key的文件
        const notFoundFiles = []; // 记录未找到key的文件
        
        for (const [fileName, fileData] of selectedFiles) {
            try {
                const yamlObj = jsyaml.load(fileData.originalContent);
                totalFiles++;
                
                if (this.keyExists(yamlObj, oldKeyPath.split('.'))) {
                    foundCount++;
                    foundFiles.push(fileName);
                } else {
                    notFoundFiles.push(fileName);
                }
            } catch (error) {
                console.error(`检查文件 ${fileName} 失败:`, error);
                notFoundFiles.push(fileName);
            }
        }
        
        // 创建文件列表显示
        let statusContent = '';
        
        if (foundCount > 0) {
            statusElement.className = 'key-status found';
            statusContent = `✓ 在 ${foundCount}/${totalFiles} 个选中文件中找到此key`;
            
            // 找到的文件列表
            const foundFileListHtml = foundFiles.map(fileName => 
                `<span class="found-file" onclick="yamlReplacer.previewFile('${fileName}')" title="点击预览文件内容">${fileName}</span>`
            ).join(', ');
            
            statusContent += `<br><div class="found-files-list">✓ 找到的文件: ${foundFileListHtml}</div>`;
        } else {
            statusElement.className = 'key-status not-found';
            statusContent = '✗ 在所有选中文件中都未找到此key';
        }
        
        // 未找到的文件列表（如果有的话）
        if (notFoundFiles.length > 0) {
            const notFoundFileListHtml = notFoundFiles.map(fileName => 
                `<span class="not-found-file" onclick="yamlReplacer.previewFile('${fileName}')" title="点击预览文件内容">${fileName}</span>`
            ).join(', ');
            
            statusContent += `<br><div class="not-found-files-list">✗ 未找到的文件: ${notFoundFileListHtml}</div>`;
        }
        
        statusElement.innerHTML = statusContent;
    }

    keyExists(obj, keyPath) {
        let current = obj;
        
        for (const key of keyPath) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                return false;
            }
            current = current[key];
        }
        
        return true;
    }

    getOldKeyPath() {
        return document.getElementById('oldKeyPath').value.trim();
    }

    getNewKeyPath() {
        return document.getElementById('newKeyPath').value.trim();
    }


    async handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.name.endsWith('.yml') || file.name.endsWith('.yaml')
        );

        if (validFiles.length === 0) {
            alert('请选择有效的YAML文件（.yml 或 .yaml）');
            return;
        }

        // 显示进度条
        this.showProgress('正在读取文件...', 0);

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            try {
                const content = await this.readFile(file);
                this.files.set(file.name, {
                    originalContent: content,
                    file: file,
                    size: file.size
                });
                
                const progress = ((i + 1) / validFiles.length) * 100;
                this.showProgress(`正在读取文件... (${i + 1}/${validFiles.length})`, progress);
            } catch (error) {
                console.error(`读取文件 ${file.name} 失败:`, error);
                alert(`读取文件 ${file.name} 失败: ${error.message}`);
            }
        }

        this.hideProgress();
        
        // 先默认选择所有新上传的文件
        this.files.forEach((fileData, fileName) => {
            this.selectedFiles.add(fileName);
        });
        
        // 然后更新显示
        this.updateFilesDisplay();
        this.showSection('filesSection');
        this.showSection('configSection');
        this.updateSelectedCount();
        this.validateInputs();
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    updateFilesDisplay() {
        const filesList = document.getElementById('filesList');
        const fileCount = document.getElementById('fileCount');
        
        fileCount.textContent = this.files.size;
        filesList.innerHTML = '';

        this.files.forEach((fileData, fileName) => {
            const isSelected = this.selectedFiles.has(fileName);
            const fileItem = document.createElement('div');
            fileItem.className = `file-item fade-in ${isSelected ? 'selected' : ''}`;
            fileItem.dataset.filename = fileName;
            fileItem.innerHTML = `
                <input type="checkbox" class="file-checkbox" ${isSelected ? 'checked' : ''} 
                       onchange="yamlReplacer.toggleFileSelection('${fileName}')">
                <div class="file-icon">📄</div>
                <div class="file-info" onclick="yamlReplacer.previewFile('${fileName}')" style="cursor: pointer; flex: 1;" title="点击预览文件内容">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${this.formatFileSize(fileData.size)}</div>
                </div>
                <button class="preview-file-btn" onclick="yamlReplacer.previewFile('${fileName}')" title="预览文件">👁</button>
                <button class="remove-file" onclick="yamlReplacer.removeFile('${fileName}')">×</button>
            `;
            filesList.appendChild(fileItem);
        });
        
        this.updateSelectedCount();
    }

    removeFile(fileName) {
        this.files.delete(fileName);
        this.selectedFiles.delete(fileName);
        this.modifiedFiles.delete(fileName);
        this.updateFilesDisplay();
        
        if (this.files.size === 0) {
            this.hideSection('filesSection');
            this.hideSection('configSection');
            this.hideSection('previewSection');
            document.getElementById('saveBtn').disabled = true;
            document.getElementById('downloadBtn').disabled = true;
        }
        this.validateInputs();
    }

    async previewChanges() {
        const oldKeyPath = this.getOldKeyPath();
        const newKeyPath = this.getNewKeyPath();
        const selectedFiles = this.getSelectedFiles();

        if (!oldKeyPath || !newKeyPath) {
            alert('请输入原Key路径和新Key路径');
            return;
        }
        
        if (selectedFiles.size === 0) {
            alert('请至少选择一个文件进行修改');
            return;
        }

        this.showProgress('正在分析更改...', 0);

        const results = new Map();
        let processedCount = 0;
        
        for (const [fileName, fileData] of selectedFiles) {
            try {
                const result = await this.analyzeKeyChange(
                    fileData.originalContent, 
                    oldKeyPath, 
                    newKeyPath
                );
                results.set(fileName, result);
                
                processedCount++;
                const progress = (processedCount / selectedFiles.size) * 100;
                this.showProgress(`正在分析更改... (${processedCount}/${selectedFiles.size})`, progress);
            } catch (error) {
                console.error(`分析文件 ${fileName} 失败:`, error);
                results.set(fileName, {
                    hasChanges: false,
                    error: error.message,
                    originalContent: fileData.originalContent,
                    modifiedContent: fileData.originalContent
                });
            }
        }

        this.hideProgress();
        this.displayPreview(results);
        this.previewResults = results;
    }

    async analyzeKeyChange(yamlContent, oldKeyPath, newKeyPath) {
        try {
            console.log(`analyzeKeyChange: "${oldKeyPath}" -> "${newKeyPath}"`);
            
            // 使用纯文本替换，不解析为YAML对象
            const oldKeys = oldKeyPath.split('.');
            const newKeys = newKeyPath.split('.');
            
            console.log('oldKeys:', oldKeys);
            console.log('newKeys:', newKeys);
            
            // 进行文本替换
            let modifiedContent = yamlContent;
            let hasChanges = false;
            
            // 替换每一级的key
            for (let i = 0; i < Math.min(oldKeys.length, newKeys.length); i++) {
                const oldKey = oldKeys[i];
                const newKey = newKeys[i];
                
                if (oldKey !== newKey) {
                    console.log(`替换第${i+1}级key: "${oldKey}" -> "${newKey}"`);
                    
                    if (i === 0) {
                        // 顶层key替换：匹配行首的key
                        const topLevelPattern = new RegExp(`^(\\s*)${this.escapeRegExp(oldKey)}(\\s*:)`, 'gm');
                        const newModifiedContent = modifiedContent.replace(topLevelPattern, `$1${newKey}$2`);
                        
                        if (newModifiedContent !== modifiedContent) {
                            modifiedContent = newModifiedContent;
                            hasChanges = true;
                            console.log(`顶层key "${oldKey}" 替换为 "${newKey}"`);
                        }
                    } else {
                        // 嵌套key替换：需要考虑缩进
                        const nestedPattern = new RegExp(`^(\\s+)${this.escapeRegExp(oldKey)}(\\s*:)`, 'gm');
                        const newModifiedContent = modifiedContent.replace(nestedPattern, `$1${newKey}$2`);
                        
                        if (newModifiedContent !== modifiedContent) {
                            modifiedContent = newModifiedContent;
                            hasChanges = true;
                            console.log(`嵌套key "${oldKey}" 替换为 "${newKey}"`);
                        }
                    }
                }
            }
            
            console.log('是否有更改:', hasChanges);
            
            if (!hasChanges) {
                console.log('没有找到需要替换的key');
                return {
                    hasChanges: false,
                    originalContent: yamlContent,
                    modifiedContent: yamlContent,
                    originalObj: this.tryParseYaml(yamlContent),
                    modifiedObj: this.tryParseYaml(yamlContent)
                };
            }
            
            return {
                hasChanges: true,
                originalContent: yamlContent,
                modifiedContent: modifiedContent,
                originalObj: this.tryParseYaml(yamlContent),
                modifiedObj: this.tryParseYaml(modifiedContent)
            };
            
        } catch (error) {
            console.error('analyzeKeyChange 错误:', error);
            throw new Error(`文本处理失败: ${error.message}`);
        }
    }

    // 转义正则表达式特殊字符
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 安全地解析YAML（用于预览对象，不影响文本替换）
    tryParseYaml(content) {
        try {
            return jsyaml.load(content);
        } catch (error) {
            console.warn('YAML解析失败，但文本替换仍然有效:', error.message);
            return null;
        }
    }

    // 检查key路径是否存在
    hasKeyPath(obj, keys) {
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined || !current.hasOwnProperty(key)) {
                return false;
            }
            current = current[key];
        }
        return true;
    }

    // 获取key路径的值
    getKeyValue(obj, keys) {
        let current = obj;
        for (const key of keys) {
            current = current[key];
        }
        return current;
    }

    // 删除key路径
    deleteKeyPath(obj, keys) {
        if (keys.length === 0) return;
        
        if (keys.length === 1) {
            // 顶层key，直接删除
            delete obj[keys[0]];
            return;
        }
        
        let current = obj;
        const path = [];
        
        // 导航到父级对象
        for (let i = 0; i < keys.length - 1; i++) {
            path.push(current);
            current = current[keys[i]];
        }
        
        // 删除最后一个key
        const lastKey = keys[keys.length - 1];
        delete current[lastKey];
        
        // 清理空的父级对象（从最深层开始）
        for (let i = path.length - 1; i >= 0; i--) {
            const parentObj = path[i];
            const parentKey = keys[i];
            if (parentObj[parentKey] && Object.keys(parentObj[parentKey]).length === 0) {
                delete parentObj[parentKey];
            } else {
                break;
            }
        }
    }

    // 设置key路径的值
    setKeyPath(obj, keys, value) {
        if (keys.length === 1) {
            // 顶层key，直接设置
            obj[keys[0]] = value;
            return;
        }
        
        let current = obj;
        
        // 创建嵌套结构
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current.hasOwnProperty(keys[i]) || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        // 设置最终值
        current[keys[keys.length - 1]] = value;
    }

    replaceKeyPathInString(yamlContent, oldKeyPath, newKeyPath) {
        console.log(`replaceKeyPathInString 被调用: "${oldKeyPath}" -> "${newKeyPath}"`);
        const lines = yamlContent.split('\n');
        const oldKeys = oldKeyPath.split('.');
        const newKeys = newKeyPath.split('.');
        
        console.log('oldKeys:', oldKeys);
        console.log('newKeys:', newKeys);
        console.log('YAML内容行数:', lines.length);
        
        // Find the exact range of the key path including all its content
        const range = this.findCompleteRange(lines, oldKeys);
        
        console.log('findCompleteRange 返回结果:', range);
        
        if (!range) {
            console.log('未找到指定的key路径，返回无更改结果');
            return {
                hasChanges: false,
                originalContent: yamlContent,
                modifiedContent: yamlContent,
                originalObj: jsyaml.load(yamlContent),
                modifiedObj: jsyaml.load(yamlContent)
            };
        }
        
        // Extract the actual value content
        const valueContent = this.extractValueContent(range.contentLines, oldKeys);
        
        // Build new structure
        const newStructure = this.buildNewStructure(newKeys, valueContent);
        
        // Replace the content
        const before = lines.slice(0, range.startLine);
        const after = lines.slice(range.endLine + 1);
        
        const modifiedContent = [...before, ...newStructure, ...after].join('\n');
        
        return {
            hasChanges: true,
            originalContent: yamlContent,
            modifiedContent,
            originalObj: jsyaml.load(yamlContent),
            modifiedObj: jsyaml.load(modifiedContent)
        };
    }

    processKeyChange(obj, oldKeys, newKeys, currentPath = []) {
        let hasChanges = false;
        
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        // 检查根层级匹配
        if (currentPath.length === 0) {
            const value = this.getNestedValue(obj, oldKeys);
            if (value !== undefined) {
                // 删除旧路径
                this.deleteNestedPath(obj, oldKeys);
                
                // 创建新路径，尽量在相似位置
                this.createNewPathAtSimilarLocation(obj, oldKeys, newKeys, value);
                
                return true;
            }
        }

        for (const key in obj) {
            const currentKeyPath = [...currentPath, key];
            
            // 检查是否匹配要替换的路径前缀
            if (this.pathStartsWith(currentKeyPath, oldKeys)) {
                const value = this.getNestedValue(obj, oldKeys);
                if (value !== undefined) {
                    // 删除旧路径
                    this.deleteNestedPath(obj, oldKeys);
                    
                    // 创建新路径
                    this.createNewPathAtSimilarLocation(obj, oldKeys, newKeys, value);
                    
                    return true;
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (this.processKeyChange(obj[key], oldKeys, newKeys, currentKeyPath)) {
                    return true;
                }
            }
        }
        
        return hasChanges;
    }

    getNestedValue(obj, keys) {
        let current = obj;
        for (const key of keys) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                return undefined;
            }
            current = current[key];
        }
        return current;
    }

    pathStartsWith(currentPath, targetPath) {
        if (currentPath.length > targetPath.length) {
            return false;
        }
        return currentPath.every((key, index) => key === targetPath[index]);
    }

    replaceKeyPathPreservingOrder(obj, oldKeys, newKeys, value) {
        // 处理直接键名替换的情况（在同一层级）
        if (oldKeys.length === newKeys.length) {
            const lastOldKey = oldKeys[oldKeys.length - 1];
            const lastNewKey = newKeys[newKeys.length - 1];
            
            let parent = obj;
            const parentPath = oldKeys.slice(0, -1);
            
            // 获取父对象
            for (const key of parentPath) {
                if (typeof parent !== 'object' || parent === null || !(key in parent)) {
                    return; // 路径不存在
                }
                parent = parent[key];
            }
            
            // 检查是否只是键名替换
            const keysMatch = parentPath.length === newKeys.slice(0, -1).length && 
                            parentPath.every((k, i) => k === newKeys[i]);
            
            if (keysMatch) {
                // 直接重命名键，保持顺序
                const newParent = {};
                const oldKeysList = Object.keys(parent);
                
                for (const key of oldKeysList) {
                    if (key === lastOldKey) {
                        newParent[lastNewKey] = value;
                    } else {
                        newParent[key] = parent[key];
                    }
                }
                
                // 替换父对象的所有属性
                for (const key of oldKeysList) {
                    delete parent[key];
                }
                
                for (const key in newParent) {
                    parent[key] = newParent[key];
                }
                
                return;
            }
        }
        
        // 复杂路径替换（不同层级），使用有序替换
        this.replaceComplexPath(obj, oldKeys, newKeys, value);
    }

    replaceComplexPath(obj, oldKeys, newKeys, value) {
        // 保存原始对象的字符串表示，以便重建顺序
        // 这是一个更可靠的方法来保持YAML顺序
        
        // 删除旧路径
        this.deleteNestedPath(obj, oldKeys);
        
        // 在根级别创建新路径
        this.createNestedPathWithOrder(obj, newKeys, value);
    }

    createNestedPathWithOrder(obj, keys, value) {
        // 找到插入位置：尝试在相似位置插入新键
        let current = obj;
        
        // 创建嵌套结构
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 设置最终值
        current[keys[keys.length - 1]] = value;
    }

    deleteNestedPath(obj, keys) {
        if (keys.length === 0) return;
        
        let current = obj;
        const pathToDelete = [...keys];
        const lastKey = pathToDelete.pop();
        
        // 导航到父对象
        const parents = [];
        for (const key of pathToDelete) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                return; // 路径不存在
            }
            parents.push({ obj: current, key });
            current = current[key];
        }
        
        // 删除最后的key
        if (typeof current === 'object' && current !== null) {
            delete current[lastKey];
            
            // 清理空的父级对象
            for (let i = parents.length - 1; i >= 0; i--) {
                const parent = parents[i].obj;
                const key = parents[i].key;
                if (typeof parent[key] === 'object' && parent[key] !== null && Object.keys(parent[key]).length === 0) {
                    delete parent[key];
                } else {
                    break; // 如果父对象不为空，停止清理
                }
            }
        }
    }

    createNestedPath(obj, keys, value) {
        let current = obj;
        
        // 创建嵌套结构
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 设置最终值
        current[keys[keys.length - 1]] = value;
    }

    isPathPrefix(currentPath, targetPath) {
        if (currentPath.length >= targetPath.length) {
            return false;
        }
        
        return currentPath.every((key, index) => key === targetPath[index]);
    }

    findCommonPrefixLength(arr1, arr2) {
        let length = 0;
        const minLength = Math.min(arr1.length, arr2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (arr1[i] === arr2[i]) {
                length++;
            } else {
                break;
            }
        }
        
        return length;
    }

    pathMatches(currentPath, targetPath) {
        if (currentPath.length !== targetPath.length) {
            return false;
        }
        
        return currentPath.every((key, index) => key === targetPath[index]);
    }

    setNestedValue(obj, keys, value) {
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    createNewPathAtSimilarLocation(obj, oldKeys, newKeys, value) {
        // 创建新路径
        let current = obj;
        for (let i = 0; i < newKeys.length - 1; i++) {
            const key = newKeys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[newKeys[newKeys.length - 1]] = value;
    }

    findCompleteRange(lines, keys) {
        let startLine = -1;
        let endLine = -1;
        let contentLines = [];
        
        // Find the exact start of the key path
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === keys[0] + ':') {
                startLine = i;
                const baseIndent = line.length - line.trimStart().length;
                
                // Navigate to the final key
                let currentLine = i + 1;
                let currentIndent = baseIndent + 2;
                
                for (let keyIndex = 1; keyIndex < keys.length; keyIndex++) {
                    let found = false;
                    for (let j = currentLine; j < lines.length; j++) {
                        const checkLine = lines[j];
                        const indent = checkLine.length - checkLine.trimStart().length;
                        const trimmed = checkLine.trim();
                        
                        if (indent < currentIndent) break;
                        
                        if (indent === currentIndent && trimmed === keys[keyIndex] + ':') {
                            currentLine = j + 1;
                            currentIndent = indent + 2;
                            found = true;
                            
                            if (keyIndex === keys.length - 1) {
                                startLine = j;
                            }
                            break;
                        }
                    }
                    if (!found) return null;
                }
                
                // Find the end of the final key's content
                endLine = startLine;
                const finalIndent = lines[startLine].length - lines[startLine].trimStart().length;
                
                for (let j = startLine + 1; j < lines.length; j++) {
                    const line = lines[j];
                    const trimmed = line.trim();
                    
                    if (trimmed === '' || trimmed.startsWith('#')) {
                        endLine = j;
                        continue;
                    }
                    
                    const indent = line.length - line.trimStart().length;
                    
                    if (indent <= finalIndent) {
                        endLine = j - 1;
                        break;
                    }
                    
                    endLine = j;
                }
                
                contentLines = lines.slice(startLine, endLine + 1);
                break;
            }
        }
        
        return startLine >= 0 ? { startLine, endLine, contentLines } : null;
    }

    extractValueContent(contentLines, keys) {
        const valueContent = [];
        let foundKey = false;
        let keyIndent = 0;
        
        for (const line of contentLines) {
            const trimmed = line.trim();
            
            if (trimmed === keys[keys.length - 1] + ':') {
                foundKey = true;
                keyIndent = line.length - line.trimStart().length;
                continue;
            }
            
            if (foundKey) {
                if (trimmed === '' || trimmed.startsWith('#')) {
                    valueContent.push(line);
                    continue;
                }
                
                const currentIndent = line.length - line.trimStart().length;
                if (currentIndent > keyIndent) {
                    valueContent.push(line);
                } else {
                    break;
                }
            }
        }
        
        return valueContent;
    }

    buildNewStructure(newKeys, valueContent) {
        const structure = [];
        
        for (let i = 0; i < newKeys.length; i++) {
            const indent = ' '.repeat(i * 2);
            
            if (i === newKeys.length - 1) {
                structure.push(indent + newKeys[i] + ':');
                // Add the value content
                for (const line of valueContent) {
                    structure.push(line);
                }
            } else {
                structure.push(indent + newKeys[i] + ':');
            }
        }
        
        return structure;
    }

    // 文件预览功能
    previewFile(fileName) {
        const fileData = this.files.get(fileName);
        if (!fileData) {
            alert('文件不存在');
            return;
        }

        // 创建预览弹窗
        const modal = document.createElement('div');
        modal.className = 'file-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>文件预览: ${fileName}</h3>
                    <span class="close-btn" onclick="this.closest('.file-preview-modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <pre class="file-content">${this.escapeHtml(fileData.originalContent)}</pre>
                </div>
                <div class="modal-footer">
                    <div class="file-info">
                        <span>文件大小: ${this.formatFileSize(fileData.size)}</span>
                        <span>行数: ${fileData.originalContent.split('\n').length}</span>
                    </div>
                    <button onclick="this.closest('.file-preview-modal').remove()" class="close-modal-btn">关闭</button>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    displayPreview(results) {
        console.log('displayPreview 被调用，结果数量:', results.size);
        let affectedCount = 0;
        let totalCount = 0;
        
        results.forEach((result, fileName) => {
            console.log(`文件 ${fileName}:`, result);
            totalCount++;
            if (result.hasChanges) {
                affectedCount++;
            }
        });

        console.log(`总文件数: ${totalCount}, 受影响文件数: ${affectedCount}`);
        
        document.getElementById('affectedCount').textContent = affectedCount;
        this.renderPreviewContent(results, 'affected');
        this.showSection('previewSection');
        
        console.log('预览区域已显示');
        
        document.getElementById('saveBtn').disabled = affectedCount === 0;
    }

    renderPreviewContent(results, filter = 'all') {
        console.log(`renderPreviewContent 被调用，过滤器: ${filter}`);
        const previewContent = document.getElementById('previewContent');
        
        if (!previewContent) {
            console.error('previewContent 元素未找到');
            return;
        }
        
        previewContent.innerHTML = '';

        let renderedCount = 0;
        results.forEach((result, fileName) => {
            if (filter === 'affected' && !result.hasChanges) {
                console.log(`跳过文件 ${fileName}，因为没有更改`);
                return;
            }

            console.log(`渲染文件 ${fileName}，hasChanges: ${result.hasChanges}`);
            renderedCount++;

            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            previewItem.innerHTML = `
                <div class="preview-header">
                    <span class="preview-filename">${fileName}</span>
                    <div class="preview-actions">
                        <span class="preview-status ${result.hasChanges ? 'status-changed' : 'status-unchanged'}">
                            ${result.hasChanges ? '✓ 有更改' : result.error ? '✗ 错误' : '- 无更改'}
                        </span>
                        ${result.hasChanges ? `
                            <button class="copy-btn" onclick="yamlReplacer.copyFileContent('${fileName}', 'modified')" title="复制修改后的内容">📋 复制修改后</button>
                            <button class="copy-btn" onclick="yamlReplacer.copyFileContent('${fileName}', 'original')" title="复制修改前的内容">📋 复制修改前</button>
                        ` : ''}
                    </div>
                </div>
                ${result.error ? `<div style="color: #dc3545; margin-top: 10px;">错误: ${result.error}</div>` : ''}
                ${result.hasChanges ? `
                    <div class="preview-diff">
                        <div class="diff-section">
                            <div class="diff-title">修改前:</div>
                            <div class="diff-content">${this.escapeHtml(result.originalContent)}</div>
                        </div>
                        <div class="diff-section">
                            <div class="diff-title">修改后:</div>
                            <div class="diff-content">${this.escapeHtml(result.modifiedContent)}</div>
                        </div>
                    </div>
                ` : ''}
            `;
            
            previewContent.appendChild(previewItem);
        });

        console.log(`渲染完成，共渲染 ${renderedCount} 个项目`);
        
        if (renderedCount === 0) {
            previewContent.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 40px;">没有找到符合条件的文件</div>';
            console.log('没有符合条件的文件，显示空状态');
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        if (this.previewResults) {
            this.renderPreviewContent(this.previewResults, tab);
        }
    }

    async saveFiles() {
        if (!this.previewResults) {
            alert('请先预览更改');
            return;
        }

        // 统计需要保存的文件
        const filesToSave = [];
        this.previewResults.forEach((result, fileName) => {
            if (result.hasChanges && !result.error) {
                filesToSave.push({
                    fileName: fileName,
                    content: result.modifiedContent
                });
            }
        });

        if (filesToSave.length === 0) {
            alert('没有文件需要保存');
            return;
        }

        // 检查是否支持File System Access API
        if ('showSaveFilePicker' in window) {
            await this.saveWithFileSystemAPI(filesToSave);
        } else {
            await this.saveWithDownload(filesToSave);
        }
    }

    async saveWithFileSystemAPI(filesToSave) {
        try {
            if (filesToSave.length === 1) {
                // 单个文件
                const file = filesToSave[0];
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: file.fileName,
                    types: [
                        {
                            description: 'YAML files',
                            accept: {
                                'text/yaml': ['.yml', '.yaml'],
                                'text/plain': ['.yml', '.yaml']
                            }
                        }
                    ]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(file.content);
                await writable.close();
                
                alert(`✅ 文件 "${file.fileName}" 已成功保存！`);
            } else {
                // 多个文件
                for (let i = 0; i < filesToSave.length; i++) {
                    const file = filesToSave[i];
                    
                    try {
                        const fileHandle = await window.showSaveFilePicker({
                            suggestedName: file.fileName,
                            types: [
                                {
                                    description: 'YAML files',
                                    accept: {
                                        'text/yaml': ['.yml', '.yaml'],
                                        'text/plain': ['.yml', '.yaml']
                                    }
                                }
                            ]
                        });
                        
                        const writable = await fileHandle.createWritable();
                        await writable.write(file.content);
                        await writable.close();
                        
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            console.log(`用户取消了保存文件: ${file.fileName}`);
                            break; // 用户取消了，停止后续文件保存
                        } else {
                            console.error(`保存文件 ${file.fileName} 失败:`, error);
                            alert(`保存文件 "${file.fileName}" 失败: ${error.message}`);
                        }
                    }
                }
                
                alert(`✅ 文件保存完成！`);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('用户取消了文件保存');
            } else {
                console.error('保存文件失败:', error);
                alert(`保存失败: ${error.message}`);
            }
        }
    }

    async saveWithDownload(filesToSave) {
        // 显示提示信息，指导用户如何操作
        const message = `🔧 您的浏览器不支持文件选择器，将使用下载方式。\n\n` +
                       `💡 要选择保存位置，请：\n` +
                       `1. 在浏览器设置中关闭"下载前询问每个文件的保存位置"\n` +
                       `2. 或者使用Ctrl+J打开下载管理器，将文件移动到目标位置\n\n` +
                       `点击确定开始下载 ${filesToSave.length} 个文件。`;
        
        if (!confirm(message)) {
            return;
        }

        // 如果只有一个文件，直接下载
        if (filesToSave.length === 1) {
            const file = filesToSave[0];
            this.downloadSingleFile(file.fileName, file.content);
            
            setTimeout(() => {
                alert(`📁 文件已下载到默认下载目录。\n\n💡 提示：按Ctrl+J打开下载管理器查看文件。`);
            }, 500);
            return;
        }

        // 多个文件的情况
        const choice = confirm(
            `共有 ${filesToSave.length} 个修改的文件。\n\n` +
            `选择下载方式：\n` +
            `• 确定 - 逐个下载（间隔500ms）\n` +
            `• 取消 - 批量快速下载`
        );

        if (choice) {
            // 逐个下载，给用户时间处理
            for (let i = 0; i < filesToSave.length; i++) {
                const file = filesToSave[i];
                
                setTimeout(() => {
                    this.downloadSingleFile(file.fileName, file.content);
                }, i * 500);
            }
            
            setTimeout(() => {
                alert(`✅ ${filesToSave.length} 个文件已下载完成！\n\n💡 按Ctrl+J打开下载管理器查看所有文件。`);
            }, filesToSave.length * 500 + 500);
        } else {
            // 批量下载
            filesToSave.forEach((file, index) => {
                setTimeout(() => {
                    this.downloadSingleFile(file.fileName, file.content);
                }, index * 100); // 更快的间隔
            });
            
            setTimeout(() => {
                alert(`🚀 ${filesToSave.length} 个文件已快速下载！\n\n💡 按Ctrl+J打开下载管理器查看所有文件。`);
            }, filesToSave.length * 100 + 500);
        }
    }

    downloadSingleFile(fileName, content) {
        try {
            const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            
            // 添加到页面并点击
            document.body.appendChild(a);
            
            // 确保在浏览器事件循环中触发点击
            setTimeout(() => {
                a.click();
                // 清理
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 10);
            
        } catch (error) {
            console.error('下载失败:', error);
            alert(`下载文件 "${fileName}" 失败: ${error.message}`);
        }
    }

    downloadMultipleFiles(filesToSave) {
        // 依次下载每个文件（间隔500ms避免浏览器阻止）
        filesToSave.forEach((file, index) => {
            setTimeout(() => {
                this.downloadSingleFile(file.fileName, file.content);
            }, index * 500);
        });
        
        alert(`🚀 将依次下载 ${filesToSave.length} 个文件，请允许浏览器的多文件下载。`);
    }

    downloadFiles() {
        if (this.modifiedFiles.size === 0) {
            alert('没有需要下载的修改文件');
            return;
        }

        if (this.modifiedFiles.size === 1) {
            // 单文件下载
            const [fileName, fileData] = this.modifiedFiles.entries().next().value;
            this.downloadSingleFile(fileName, fileData.modifiedContent);
        } else {
            // 多文件打包下载
            this.downloadMultipleFiles();
        }
    }

    async downloadMultipleFiles() {
        // 这里可以使用JSZip库来创建ZIP文件
        // 为了简化，我们逐个下载文件
        let downloadCount = 0;
        for (const [fileName, fileData] of this.modifiedFiles) {
            setTimeout(() => {
                this.downloadSingleFile(fileName, fileData.modifiedContent);
            }, downloadCount * 500); // 间隔500ms下载
            downloadCount++;
        }
        
        alert(`将下载 ${this.modifiedFiles.size} 个文件，请允许浏览器的多文件下载。`);
    }

    // 复制文件内容到剪贴板
    async copyFileContent(fileName, type) {
        if (!this.previewResults) {
            alert('没有预览结果可复制');
            return;
        }

        const result = this.previewResults.get(fileName);
        if (!result) {
            alert('未找到文件结果');
            return;
        }

        let contentToCopy = '';
        let buttonText = '';
        
        if (type === 'modified') {
            contentToCopy = result.modifiedContent;
            buttonText = '修改后的内容';
        } else if (type === 'original') {
            contentToCopy = result.originalContent;
            buttonText = '修改前的内容';
        } else {
            alert('无效的复制类型');
            return;
        }

        try {
            // 使用现代的 Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(contentToCopy);
                this.showCopySuccess(fileName, buttonText);
            } else {
                // 降级方案：使用传统的方法
                this.fallbackCopyToClipboard(contentToCopy);
                this.showCopySuccess(fileName, buttonText);
            }
        } catch (error) {
            console.error('复制失败:', error);
            // 如果现代API失败，尝试降级方案
            try {
                this.fallbackCopyToClipboard(contentToCopy);
                this.showCopySuccess(fileName, buttonText);
            } catch (fallbackError) {
                console.error('降级复制也失败:', fallbackError);
                alert(`复制失败: ${error.message}`);
            }
        }
    }

    // 降级复制方案
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        try {
            const result = document.execCommand('copy');
            if (!result) {
                throw new Error('execCommand copy 返回 false');
            }
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 显示复制成功的提示
    showCopySuccess(fileName, contentType) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.innerHTML = `✅ 已复制 "${fileName}" 的${contentType}到剪贴板`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
            section.classList.add('fade-in');
        }
    }

    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    }

    showProgress(text, progress) {
        const progressSection = document.getElementById('progressSection');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        progressSection.style.display = 'block';
        progressText.textContent = text;
        progressFill.style.width = `${progress}%`;
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        progressSection.style.display = 'none';
    }
}

// 初始化应用
// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.yamlReplacer = new YamlKeyReplacer();
});