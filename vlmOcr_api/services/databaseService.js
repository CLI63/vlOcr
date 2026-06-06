const { MySQLHelper } = require('../utils/mysql');

class DatabaseService {
    // 图片历史相关操作
    static async getImageHistory(limit = 50, offset = 0) {
        const sql = `SELECT * FROM img_history ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        return await MySQLHelper.query(sql);
        // const sql = `SELECT * FROM img_history ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        // return await MySQLHelper.query(sql, [limit, offset]);
    }

    static async getImageById(id) {
        return await MySQLHelper.findOne('img_history', { id });
    }

    static async getImagesByModel(modelName, limit = 50, offset = 0) {
        // const sql = `SELECT * FROM img_history WHERE modelName = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        // return await MySQLHelper.query(sql, [modelName, limit, offset]);
        const sql = `SELECT * FROM img_history WHERE modelName = '${modelName}' ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        return await MySQLHelper.query(sql);
    }

    static async saveImageHistory(data) {
        const record = {
            id: data.id,
            imgUrl: data.imgUrl,
            imgSrc: data.imgSrc,
            fileMd5: data.fileMd5,
            ocrText: data.ocrText,
            modelName: data.modelName,
            allModel: data.allModel,
            ocrInfo: data.ocrInfo || null
        };
        return await MySQLHelper.insert('img_history', record);
    }

    static async updateImageHistory(id, data) {
        return await MySQLHelper.update('img_history', data, { id });
    }

    static async deleteImageHistory(id) {
        return await MySQLHelper.delete('img_history', { id });
    }

    static async deleteImageByMd5(fileMd5) {
        const result = await MySQLHelper.delete('img_history', { fileMd5 });
        return result.affectedRows;
    }

    static async getImageCountByModel() {
        const sql = `SELECT modelName, COUNT(*) as count FROM img_history GROUP BY modelName ORDER BY count DESC`;
        return await MySQLHelper.query(sql);
    }

    // 模型相关操作
    static async getAllModels() {
        const models = await MySQLHelper.findAll('models', {}, 'id ASC');
        
        // 为每个模型添加关键词
        for (const model of models) {
            const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
            model.keyWords = keywords.map(kw => ({
                text: kw.keyword_text,
                index: kw.keyword_index
            }));
        }
        
        return models;
    }

    static async getModelById(id) {
        const model = await MySQLHelper.findOne('models', { id });
        if (model) {
            const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
            model.keyWords = keywords.map(kw => ({
                text: kw.keyword_text,
                index: kw.keyword_index
            }));
        }
        return model;
    }

    static async getModelByName(modelName) {
        const model = await MySQLHelper.findOne('models', { modelName });
        if (model) {
            const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
            model.keyWords = keywords.map(kw => ({
                text: kw.keyword_text,
                index: kw.keyword_index
            }));
        }
        return model;
    }

    static async saveModel(data) {
        const modelRecord = {
            id: data.id,
            modelName: data.modelName,
            description: data.description,
            glmTips: data.glmTips,
            moreApi: data.moreApi
        };

        const result = await MySQLHelper.insert('models', modelRecord);

        // 保存关键词
        if (data.keyWords && Array.isArray(data.keyWords)) {
            const keywords = data.keyWords.map(keyword => ({
                model_id: data.id,
                keyword_text: keyword.text,
                keyword_index: keyword.index
            }));
            
            if (keywords.length > 0) {
                await MySQLHelper.batchInsert('model_keywords', keywords);
            }
        }

        return result;
    }

    static async updateModel(id, data) {
        const modelData = {
            modelName: data.modelName,
            description: data.description,
            glmTips: data.glmTips,
            moreApi: data.moreApi
        };

        await MySQLHelper.update('models', modelData, { id });

        // 更新关键词
        if (data.keyWords && Array.isArray(data.keyWords)) {
            await MySQLHelper.delete('model_keywords', { model_id: id });
            
            const keywords = data.keyWords.map(keyword => ({
                model_id: id,
                keyword_text: keyword.text,
                keyword_index: keyword.index
            }));
            
            if (keywords.length > 0) {
                await MySQLHelper.batchInsert('model_keywords', keywords);
            }
        }

        return true;
    }

    static async deleteModel(id) {
        return await MySQLHelper.delete('models', { id });
    }

    // 搜索功能
    static async searchImages(searchTerm, limit = 50) {
        const sql = `
            SELECT * FROM img_history 
            WHERE ocrText LIKE ? OR modelName LIKE ? 
            ORDER BY created_at DESC 
            LIMIT ${limit}
        `;
        const searchPattern = `%${searchTerm}%`;
        return await MySQLHelper.query(sql, [searchPattern, searchPattern]);
    }

    static async searchImagesByFile(fileMd5 = null, imageUrl = null, limit = 10, offset = 0) {
        let sql = `SELECT * FROM img_history WHERE 1=1`;
        const params = [];
        
        if (fileMd5) {
            sql += ` AND fileMd5 = ?`;
            params.push(fileMd5);
        }
        
        if (imageUrl) {
            sql += ` AND imgUrl = ?`;
            params.push(imageUrl);
        }
        
        sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        
        return await MySQLHelper.query(sql, params);
    }

    // 统计数据
    static async getStatistics() {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM img_history) as total_images,
                (SELECT COUNT(*) FROM models) as total_models,
                (SELECT COUNT(DISTINCT modelName) FROM img_history) as active_models
        `;
        const result = await MySQLHelper.query(sql);
        return result[0];
    }

    static async getAllModelNames() {
        const sql = `SELECT DISTINCT modelName FROM img_history WHERE modelName IS NOT NULL AND modelName != '' ORDER BY modelName`;
        const results = await MySQLHelper.query(sql);
        return results.map(row => row.modelName);
    }
}

module.exports = DatabaseService;