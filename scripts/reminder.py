# Portfolio Investment Reminder Script
# This script sends monthly investment reminders

import json
import os
from datetime import datetime
from hermes_tools import send_message

def check_investment_reminder():
    """Check if today is the 1st of the month and send reminder"""
    
    today = datetime.now()
    
    # Check if it's the 1st of the month
    if today.day == 1:
        # Load portfolio data
        portfolio_data = {
            "monthlyAmountHKD": 8000,
            "exchangeRate": 7.8,
            "etfs": {
                "VOO": {"name": "Vanguard S&P 500 ETF", "allocation": 0.30},
                "QQQ": {"name": "Invesco QQQ Trust", "allocation": 0.25},
                "SPMO": {"name": "Invesco S&P 500 Momentum ETF", "allocation": 0.20},
                "XLK": {"name": "Technology Select Sector SPDR", "allocation": 0.15},
                "SMH": {"name": "VanEck Semiconductor ETF", "allocation": 0.10}
            }
        }
        
        monthly_usd = portfolio_data["monthlyAmountHKD"] / portfolio_data["exchangeRate"]
        
        message = f"""🗓️ **月供投資提醒**

今天是 **{today.strftime('%Y年%m月%d日')}**，是您的定投日！

📊 **本期投資詳情**

每月總投入：**${portfolio_data['monthlyAmountHKD']:,} 港幣** (約 ${monthly_usd:.2f} USD)

各ETF分配：
"""
        
        for symbol, etf in portfolio_data["etfs"].items():
            amount = monthly_usd * etf["allocation"]
            message += f"• **{symbol}** ({etf['name']}): ${amount:.2f} USD ({etf['allocation']*100:.0f}%)\n"
        
        message += f"""
💡 **操作提示**
1. 登入您的券商帳戶
2. 按上述金額購買各ETF
3. 完成後到 Portfolio Tracker 網站記錄本期投資

🔗 Portfolio Tracker: https://jasonckfan.github.io/portfolio-tracker

祝您投資順利！📈
"""
        
        # Send message via Telegram
        send_message(message=message, target="telegram")
        
        return True
    
    return False

def check_rebalance_reminder():
    """Check if it's time for semi-annual rebalance check"""
    
    today = datetime.now()
    
    # Check if it's January 1st or July 1st
    if today.day == 1 and today.month in [1, 7]:
        
        message = f"""⚠️ **半年度組合檢視提醒**

今天是 **{today.strftime('%Y年%m月%d日')}**，是時候檢視您的投資組合了！

📋 **檢視項目**

1. **回報率分析**
   - 檢查實際回報率是否達到目標 (10-12%)
   - 與目標回報率比較，評估是否需要調整

2. **配置比例檢查**
   - 檢視各ETF的實際配置是否偏離目標
   - 如有需要，進行再平衡操作

3. **風險評估**
   - 評估組合的整體風險水平
   - 考慮是否需要調整SMH等高波動ETF的配置

4. **市場環境分析**
   - 檢視當前市場趨勢
   - 評估是否需要調整策略

🔗 Portfolio Tracker: https://jasonckfan.github.io/portfolio-tracker

記得查看「組合配置分析」功能獲取詳細建議！
"""
        
        # Send message via Telegram
        send_message(message=message, target="telegram")
        
        return True
    
    return False

if __name__ == "__main__":
    # Check for monthly investment reminder
    investment_sent = check_investment_reminder()
    
    # Check for rebalance reminder
    rebalance_sent = check_rebalance_reminder()
    
    if investment_sent:
        print("Investment reminder sent successfully")
    
    if rebalance_sent:
        print("Rebalance reminder sent successfully")
    
    if not investment_sent and not rebalance_sent:
        print("No reminders needed today")
