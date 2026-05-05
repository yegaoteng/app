/*!
 * @name ikun音源[公益]
 * @description QQ群1073165843
 * @version v24
 * @author ikunshare
 * @homepage https://c.wwwweb.top
 */

const pluginInfo = {"apiKey":"","author":"ikunshare","description":"QQ群1073165843","name":"ikun音源[公益]","type":"cr","updateMd5":"d96c50e643b49e6e999c3b2c1efbe26c","version":"v24"};

const sources = {"kw":{"name":"酷我音乐","qualitys":["128k","320k","flac","hires"]},"wy":{"name":"网易云音乐","qualitys":["128k","320k","flac","hires","atmos","master"]}};

const apiUrl = "https://c.wwwweb.top";

const {request, NoticeCenter} = cerumusic;

function pluginName(source) {
    const srcName = sources[source] ? sources[source].name : source;
    return `[${pluginInfo.name} <${srcName}>]`;
}

async function musicUrl(source, musicInfo, quality) {
    try {
        if (!sources[source]) {
            throw new Error(`无效的音源: ${source}`);
        }

        if (!sources[source].qualitys.includes(quality)) {
            throw new Error(`无效的音质: ${quality}，支持的音质: ${sources[source].qualitys.join(', ')}`);
        }

        const songId = musicInfo.hash ?? musicInfo.songmid ?? musicInfo.id;

        if (!songId) {
            throw new Error('音乐ID不存在');
        }

        console.log(`${pluginName(source)} 请求音乐链接: 歌曲ID: ${songId}, 音质: ${quality}`);

        const result = await request(`${apiUrl}/music/url`, {
            method: 'POST',
            body: JSON.stringify(
                {
                    source: source,
                    musicId: songId,
                    quality: quality
                }
            ),
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': pluginInfo.apiKey,
                'User-Agent': `CeruMusic-Plugin/${pluginInfo.version}`
            },
            timeout: 15000
        });

        if (result.statusCode === 200 && result.body && result.body.code === 200) {
            if (result.body.url) {
                console.log(`${pluginName(source)} 获取音乐链接成功`);
                return result.body.url;
            } else {
                throw new Error('返回数据中没有音乐链接');
            }
        } else if (result.body && result.body.code) {
            switch (result.body.code) {
                case 403:
                    NoticeCenter('error', {
                        title: '音乐链接获取失败',
                        content: `来源: ${pluginName(source)}, 错误: API Key失效或鉴权失败`
                    });
                    throw new Error('API Key失效或鉴权失败');
                case 429:
                    NoticeCenter('error', {
                        title: '音乐链接获取失败',
                        content: `来源: ${pluginName(source)}, 错误: 请求过于频繁`
                    });
                    throw new Error('请求过于频繁');
                default:
                    throw new Error(`API错误: ${result.body.message || '未知错误'}`);
            }
        } else {
            throw new Error(`HTTP请求失败: ${result.statusCode}`);
        }
    } catch (error) {
        console.error(`${pluginName(source)} 错误:`, error.message);
        throw new Error(error.message ?? error);
    }
}

const checkUpdate = async () => {
    try {
        const {body} = await request(
            `${apiUrl}/script/cerumusic?checkUpdate=${pluginInfo.updateMd5}&key=${pluginInfo.apiKey}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": `CeruMusic-Plugin/${pluginInfo.version}`
                },
            }
        );

        if (!body || body.code !== 200) {
            console.log('版本更新检测未通过或无更新');
        } else {
            if (body.data != null) {
                NoticeCenter('update', {
                    title: `${pluginInfo.name} 有新的版本 ${body.data.version}`,
                    content: body.data.updateMsg,
                    url: `${body.data.updateUrl}`,
                    version: body.data.version,
                    pluginInfo: {
                        name: pluginInfo.name,
                        type: 'cr'
                    }
                })
            }
        }
    } catch (error) {
        console.error("checkUpdate error:", error);
    }
};

checkUpdate();

module.exports = {
    pluginInfo,
    sources,
    musicUrl
};