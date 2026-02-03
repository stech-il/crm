# דחיפה ל-GitHub

## אופציה 1: הרצת הסקריפט

לחץ פעמיים על `push-to-github.bat` או הרץ בטרמינל:

```
push-to-github.bat
```

## אופציה 2: פקודות ידניות

פתח **Command Prompt** או **PowerShell** בתיקיית הפרויקט והרץ:

```bash
git init
git remote add origin https://github.com/stech-il/crm.git
git add .
git commit -m "Initial commit: CRM Cloud"
git branch -M main
git push -u origin main
```

## הערות

- **node_modules** לא יידחף – הוא מוגדר ב-.gitignore
- **.env** לא יידחף – מכיל סודות
- אם ה-repo כבר קיים עם קבצים: `git pull origin main --allow-unrelated-histories` לפני ה-push
- אם נדרשת אימות: השתמש ב-GitHub CLI (`gh auth login`) או ב-Personal Access Token
