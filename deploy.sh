#!/bin/bash
# Deploy Portfolio Tracker to GitHub Pages

set -e

echo "🚀 Deploying Portfolio Tracker to GitHub Pages..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
fi

# Check remote
if ! git remote | grep -q "origin"; then
    echo -e "${YELLOW}Please enter your GitHub repository URL:${NC}"
    echo "Format: https://github.com/username/portfolio-tracker.git"
    read repo_url
    git remote add origin "$repo_url"
fi

# Create necessary files
echo -e "${GREEN}✓${NC} Checking files..."

# Create README.md if not exists
if [ ! -f README.md ]; then
    cat > README.md << 'EOF'
# ETF Portfolio Tracker

一個簡單易用的 ETF 投資組合追蹤工具，幫助您記錄每月投資、追蹤回報率，並提供投資建議。

## 功能特點

- 📊 實時顯示投資組合價值和回報率
- 📈 圖表展示投資組合走勢
- 🗓️ 每月投資提醒
- ⚠️ 半年度組合檢視提醒
- 💰 自動計算各ETF投入金額和回報
- 🔄 支持配置比例調整

## 投資組合配置

| ETF | 配置 | 每月投入(USD) |
|-----|------|--------------|
| VOO | 30% | ~$308 |
| QQQ | 25% | ~$256 |
| SPMO | 20% | ~$205 |
| XLK | 15% | ~$154 |
| SMH | 10% | ~$103 |

**每月總投入**: $8,000 港幣 (~$1,026 USD)

## 使用方法

1. 打開網站: https://[your-username].github.io/portfolio-tracker
2. 在「設定」中調整您的投資參數
3. 每月1日點擊「標記為已完成」記錄投資
4. 查看投資組合表現和回報率

## 數據存儲

所有數據存儲在瀏覽器的 localStorage 中，不會上傳到任何服務器。

## 免責聲明

本工具僅供參考，不構成投資建議。投資涉及風險，過往表現不代表未來回報。

## License

MIT License
EOF
    echo -e "${GREEN}✓${NC} Created README.md"
fi

# Create .gitignore
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
.DS_Store
*.log
node_modules/
.env
EOF
    echo -e "${GREEN}✓${NC} Created .gitignore"
fi

# Add all files
echo -e "${YELLOW}Adding files to git...${NC}"
git add -A

# Commit
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Initial commit: ETF Portfolio Tracker" || echo -e "${YELLOW}No changes to commit${NC}"

# Push to main branch
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin main || git push -u origin master

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Your Portfolio Tracker is now live at:${NC}"
echo -e "https://$(git remote get-url origin | sed 's/.*github.com\///; s/\.git$//').github.io/portfolio-tracker"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for GitHub Pages to build and deploy.${NC}"
