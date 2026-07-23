# 本地夜叉套资源只读审计

审计日期：2026-07-23
范围：`D:\SteamLibrary\steamapps\common\BlackMythWukong`、`E:\GameRecord\Black Myth Wukong`、本机常见工具安装位置与当前仓库
约束：只读检查；未删除、移动、覆盖或修改任何源文件；未下载或运行第三方解包程序；未尝试绕过加密、签名或 DRM。

## 结论

1. 游戏安装目录没有可直接用于 UI 的松散图片或视频。主体资源位于 `b1\Content\Paks` 的大型签名 PAK 中，安装目录也没有 `UnrealPak.exe`。
2. `E:\GameRecord\Black Myth Wukong\mods` 的四个夜叉模组是标准 UE Pak v11 容器。尾部索引为可读索引，能验证挂载路径和 `T_WuKong_YeChaWang_*` 纹理族；本次没有解压或预览内容，因此不能把“索引可读”误写成“贴图已安全导出”。
3. 在已检查的命令路径、游戏目录、`E:\GameRecord`、当前仓库、用户 Downloads/Documents/Desktop、Program Files、AppData 常见位置中，没有发现可信的已安装 `FModel`、`umodel`、`UnrealPak`、`repak`、`UAssetGUI` 或 `UAssetAPI`。
4. 安全停止点已经到达：在没有可信、已安装且来源可核验的工具时，不继续下载或运行陌生二进制，也不尝试处理游戏主体 PAK 的签名、加密或 DRM。

## 游戏安装目录证据

`D:\SteamLibrary\steamapps\common\BlackMythWukong\b1\Content\Paks` 包含：

- `pakchunk0-Windows.pak` 至多个大型 `pakchunk*.pak`
- 对应的 `.sig` 签名文件
- 没有可直接消费的夜叉套 PNG/JPG/WebP/视频

安装目录的 `Engine\Binaries` 与游戏根目录没有发现 `UnrealPak.exe`、FModel、umodel 或 repak。游戏的 Shipping 可执行文件不是资源提取工具，本次没有把它当作解包器使用。

## 夜叉模组 PAK 验证

以下校验值来自只读读取：

| PAK | 字节数 | SHA-256 | UE Pak 版本 | 索引偏移 | 索引大小 |
| --- | ---: | --- | ---: | ---: | ---: |
| `粉粉的夜叉-pakchunk300-Windows.pak` | 4,011,081 | `ED5AA1410DF4596C9071771510440BDB011051B7CF875CCD120CACD38E916452` | 11 | 4,005,515 | 4,349 |
| `金色夜叉_pakchunk300-Windows_p.pak` | 21,644,640 | `FFAD0B8E078F335AA905FFEAD231B13B711AAA1D4026C8941B8E9D85256C78A5` | 11 | 21,637,108 | 5,166 |
| `龙袍夜叉(红色版)pakchunk244-Windows.pak` | 18,846,241 | `FF95B040CD9380198523559757BD9B92AD9AA4DA2968104A10A82D65D1EAC992` | 11 | 18,840,502 | 3,541 |
| `夜叉-金银.pak` | 24,167,373 | `0B1F20FC03C4C97CEEDBB8EA467B24B02762A91F928EE7C9151F0D95D70245BE` | 11 | 24,160,196 | 5,153 |

PAK 索引中可验证的挂载路径：

`../../../b1/Content/00MainHZ/Characters/Wukong/Textures/Equip/YeChaWang/`

可验证的纹理族：

- `T_WuKong_YeChaWang_yifu_D`
- `T_WuKong_YeChaWang_yifu_P`
- `T_WuKong_YeChaWang_kuijia_D`
- `T_WuKong_YeChaWang_kuijia_P`
- `T_WuKong_YeChaWang_mianju_D`
- `T_WuKong_YeChaWang_mianju_P`（部分索引写作小写 `_p`）
- `T_WuKong_YeChaWang_shengzi_D`
- `T_WuKong_YeChaWang_shengzi_P`
- `T_WuKong_YeChaWang_shoutao_D`
- `T_WuKong_YeChaWang_shoutao_RSAT`
- `T_WuKong_YeChaWang_tuijia_D`
- `T_WuKong_YeChaWang_tuijia_P`

覆盖差异：

- 粉色版只明确列出六组 `_D` 漫反射纹理。
- 金色版和金银版包含多数 `_D` + `_P` 组合。
- 红色龙袍版包含多数 `_D` + `_P`，并明确出现 `shoutao_RSAT`。

PAK footer 声明了 `Oodle` 压缩方法。索引可读只说明文件名与挂载路径可验证；资源负载是否还需要版本映射、Oodle 解压或特定 Unreal 资产解析，本次没有执行验证。

## 不解包的无失真替代路线

### 路线 A：本地游戏实录/截图作为结构真值

本地已有大量用户自有画面：

- `E:\GameRecord\Black Myth Wukong\悟空·4K`：588 张 4K 图片
- `E:\GameRecord\Black Myth Wukong\新汇总`：29 个视频
- `E:\GameRecord\Black Myth Wukong\旧汇总`：23 个视频
- `E:\GameRecord\Black Myth Wukong\TipsImg`：78 张图片
- `E:\GameRecord\Black Myth Wukong\图片`：32 张图片

推荐从能清楚看到正面、侧面和背面的夜叉套画面取样，建立三视图式结构板：面具、肩甲、蓝黑绣衣、红色筋肉护臂、腰绳、腿甲分别裁切。原始截图只作为内部结构和色彩校准来源；发布包中不直接打包整张游戏截图或解包贴图。

若现有截图没有完整夜叉套，可由用户在游戏中装备夜叉套与神锋，使用照片模式或静止场景补拍正面、45°、侧面、背面和棍花关键帧。让游戏本身完成材质、光照和骨骼渲染，比把低清商品图压成纹理条更可靠。

### 路线 B：官方手办图作为结构参考

官方/授权手办图只用于校准轮廓与部件关系：

- 面具的角、牙和额部比例
- 胸甲与绣衣的叠层
- 护臂的肉甲结构
- 腰绳、裙甲、腿甲连接
- 神锋的牙笼、青色核心和金属节奏

不把商品图原图、抠图或其局部像素直接打包进主题；最终资产使用自绘矢量/原创重绘。

### 路线 C：自绘矢量与分层重绘

先按实录和官方手办结构建立 4 至 6 个可辨识层，而不是依赖一条照片纹理：

1. 蓝黑绣衣的大轮廓和交领；
2. 暗金甲片；
3. 肉红护臂/筋膜转折；
4. 腰绳与垂带；
5. 面具牙角；
6. 神锋牙笼与青色核心。

这样可以在 UI 小尺寸下保留身份特征，也避免发布包直接包含官图或游戏解包纹理。

## Composer 高保真显示下限

`64 × 8` 失败的原因不是颜色，而是信息容量和裁切语义都不成立：

- 8 像素高度无法同时保留交领、肩线、胸甲、腰带与绣纹；缩放后只剩一条模糊的深色横纹。
- 8:1 的极端长宽比抹掉了服装轮廓，用户看不到“这是衣服”，只能看到“这是边框纹理”。
- 截图或商品图经过裁切、旋转、缩小、抗锯齿后，原始材质细节被混色，越追求写实越像噪点。
- 单独的护臂交叉抠图在小尺寸会被读成装饰叉号，不会被识别成夜叉套。

建议的最低显示规格：

- 夜叉上身结构块：原始资产至少 `384 × 288`，运行时显示不小于 `96 × 64`；裁切需包含双肩、交领、胸甲、护臂之一和腰部起点。
- 若只占 composer 左侧内边缘，可用 `72 × 72` 的方形/近方形局部，保留完整肩—领—胸轮廓，再向正文区域做透明渐隐；不要再压成横向纹理条。
- 神锋完整武器若要“高保真”，运行时至少需要 `64 × 64`。在原生约 `32–40 px` 发送区中，只能诚实地做“神锋头部识别符号”：至少三枚象牙色长牙、清晰青色核心、暗金牙笼；不要声称能在 40 px 内还原整把神锋。
- 所有运行时图形应准备 2× 或 3× 源图，但验收必须看 100% 缩放下的 1× 截图，而不是放大预览。

## 可执行建议

1. 不再从 V4 的 `64 × 8` 衣领条和 `22 × 18` 护臂块继续迭代，它们只能作为失败记录。
2. 先从用户自有 4K 画面中选出一张完整夜叉套正面/45°图，制作 `96 × 64` 结构裁切试验；若 1× 下不能无文字识别，立即停止该方向。
3. 宠物以完整夜叉套轮廓为主体，材质细节作为二级信息；动作帧不能逐帧重新生成衣服，必须在同一个基础角色分层上做骨骼/局部变形，避免夜叉衣服每帧失真。
4. 发布资产仅包含原创重绘/自绘矢量和用户明确授权的自有素材；官图、商品图、游戏 PAK 或解包贴图只作本地参考，不进入安装包。
