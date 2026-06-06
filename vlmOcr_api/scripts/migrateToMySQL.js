const fs = require('fs');
const path = require('path');
const { MySQLHelper } = require('../utils/mysql');

async function migrateData() {
    try {
        console.log('Starting data migration...');

        // 读取imgHstory.json
        const imgHistoryPath = path.join(__dirname, '..', 'jsonDB', 'imgHstory.json');
        const imgHistoryData = JSON.parse(fs.readFileSync(imgHistoryPath, 'utf8'));

        // 读取model.json
        const modelPath = path.join(__dirname, '..', 'jsonDB', 'model.json');
        const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

        // 清空现有数据
        await MySQLHelper.query('DELETE FROM model_keywords');
        await MySQLHelper.query('DELETE FROM img_history');
        await MySQLHelper.query('DELETE FROM models');

        // 迁移模型数据
        console.log('Migrating models data...');
        for (const model of modelData) {
            const modelRecord = {
                id: model.id,
                modelName: model.modelName,
                description: model.description,
                glmTips: model.glmTips,
                moreApi: model.moreApi
            };
            
            await MySQLHelper.insert('models', modelRecord);

            // 迁移关键词
            if (model.keyWords && Array.isArray(model.keyWords)) {
                const keywords = model.keyWords.map(keyword => ({
                    model_id: model.id,
                    keyword_text: keyword.text,
                    keyword_index: keyword.index
                }));
                
                if (keywords.length > 0) {
                    await MySQLHelper.batchInsert('model_keywords', keywords);
                }
            }
        }

        // 迁移图片历史数据
        console.log('Migrating img_history data...');
        for (const img of imgHistoryData) {
            const imgRecord = {
                id: img.id,
                imgUrl: img.imgUrl,
                imgSrc: img.imgSrc,
                fileMd5: img.fileMd5,
                ocrText: img.ocrText,
                modelName: img.modelName,
                ocrInfo: img.ocrInfo || null
            };
            
            await MySQLHelper.insert('img_history', imgRecord);
        }

        console.log('Data migration completed successfully!');
        console.log(`Migrated ${modelData.length} models and ${imgHistoryData.length} image records`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    migrateData()
        .then(() => {
            console.log('Migration script finished');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateData };