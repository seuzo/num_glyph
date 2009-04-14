/*
num_glyph.jsx
(c)2007-2009 www.seuzo.jp
選択テキストの数字字形を変更します。
2007.08.08	ver.0.1	AppleScript版プロトタイプ。
2007.09.18	ver.0.2 GUIをつけた。いろいろ処理を選べるようにした。JavaScriptで書き直し。
2007.09.21	ver.0.3 ポップアップメニューをラジオボタンに変えた。気分の問題。
2009.04.14	ver.0.4	InDesign CS4対応。数字だけを選択していても変換するようにした。桁処理時に、半角ピリオドや半角カンマを含んだ数字列は変換しないようにした。
*/


////////////////////////////////////////////エラー処理 
function myerror(mess) { 
  if (arguments.length > 0) { alert(mess); }
  exit();
}


////////////////////////////////////////////ラジオダイアログ
/*
myTitle	ダイアログ（バー）のタイトル
myPrompt	メッセージ
myList	ラジオボタンに展開するリスト

result	選択したリスト番号
*/
function radioDialog(my_title, my_prompt, my_list){
	var my_dialog = app.dialogs.add({name:my_title, canCancel:true});
	with(my_dialog) {
		with(dialogColumns.add()) {
			// プロンプト
			staticTexts.add({staticLabel:my_prompt});
			with (borderPanels.add()) {
				var my_radio_group = radiobuttonGroups.add();
				with (my_radio_group) {
					for (var i = 0; i < my_list.length; i++){
						if (i == 0) {
							radiobuttonControls.add({staticLabel:my_list[i], checkedState:true});
						} else {
						radiobuttonControls.add({staticLabel:my_list[i]});
						}
					}
				}
			}
		}
	}


	if (my_dialog.show() == true) {
		var ans = my_radio_group.selectedButton;
		//正常にダイアログを片付ける
		my_dialog.destroy();
		//選択したアイテムの番号を返す
		return ans;
	} else {
		// ユーザが「キャンセル」をクリックしたので、メモリからダイアログボックスを削除
		my_dialog.destroy();
	}
}


////////////////////////////////////////////正規表現検
//正規表現で検索して、ヒットオブジェクトを返すだけ
function my_regex(my_range_obj, my_find_str, my_change_str) {
        //検索の初期化
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        //検索オプション
        app.findChangeGrepOptions.includeLockedLayersForFind = false;//ロックされたレイヤーをふくめるかどうか
        app.findChangeGrepOptions.includeLockedStoriesForFind = false;//ロックされたストーリーを含めるかどうか
        app.findChangeGrepOptions.includeHiddenLayers = false;//非表示レイヤーを含めるかどうか
        app.findChangeGrepOptions.includeMasterPages = false;//マスターページを含めるかどうか
        app.findChangeGrepOptions.includeFootnotes = false;//脚注を含めるかどうか
        app.findChangeGrepOptions.kanaSensitive = true;//カナを区別するかどうか
        app.findChangeGrepOptions.widthSensitive = true;//全角半角を区別するかどうか

        app.findGrepPreferences.findWhat = my_find_str;//検索文字の設定
        //app.changeGrepPreferences.changeTo = my_change_str;//置換文字の設定
        return my_range_obj.findGrep();//検索の実行
}


////////////////////////////////////////////字形の一括変換
/*
my_obj	字形を変更したいテキストオブジェクト
my_gliph	グリフフォーム（ex. AlternateGlyphForms.MONOSPACED_HALF_WIDTH_FORM;//半角字形
*/
function all_glyph_change(my_obj, my_gliph) {
	for (var i = 0; i < my_obj.length; i++) {
		my_obj[i].glyphForm = my_gliph;
	}
}


/////実行
////////////////まずは選択しているもののチェック
if (app.documents.length == 0) {myerror("ドキュメントが開かれていません")}
var mydocument = app.activeDocument;
if (mydocument.selection.length == 0) {myerror("テキストを選択してください")}
var myselection = mydocument.selection[0];
var myclass =myselection.reflect.name;
myclass = "Text, TextColumn, Story, Paragraph, Line, Word, Character, TextStyleRange".match(myclass);
if (myclass == null) {myerror("テキストを選択してください")}

////////////////処理の選択
var myList = ["すべてを標準字形にする", 
"すべてを二分字形にする", 
"すべてを三分字形にする", 
"すべてを四分字形にする", 
"２桁だけを二分字形にする", 
"３桁だけを三分字形にする", 
"４桁だけを四分字形にする", 
"２桁を二分字形に、３桁を三分字形にする", 
"２桁を二分字形に、３桁を三分字形、４桁を四分字形にする"];
var ans_int = radioDialog("num_glyph", "数字の字形を変更します。処理を選択してください\n", myList);
//myList[ans_int];

////////////////検索の実行
var hit_obj = my_regex(myselection, "[0-9,.]+", "");

if (ans_int == 0) {//すべてを標準字形にする
	all_glyph_change(hit_obj, AlternateGlyphForms.NONE);
} else if (ans_int == 1) {//すべてを二分字形にする
	all_glyph_change(hit_obj, AlternateGlyphForms.MONOSPACED_HALF_WIDTH_FORM);
} else if (ans_int == 2) {//すべてを三分字形にする
	all_glyph_change(hit_obj, AlternateGlyphForms.THIRD_WIDTH_FORM);
} else if (ans_int == 3) {//すべてを四分字形にする
	all_glyph_change(hit_obj, AlternateGlyphForms.QUARTER_WIDTH_FORM);
} else if (ans_int == 4) {//２桁だけを二分字形にする
	for (var i = 0; i < hit_obj.length; i++) {
		if (/[,.]/.test(hit_obj[i].contents)) {continue;}
		if (hit_obj[i].contents.length == 2) {
			hit_obj[i].glyphForm = AlternateGlyphForms.MONOSPACED_HALF_WIDTH_FORM;
		}
	}
} else if (ans_int == 5) {//３桁だけを三分字形にする
	for (var i = 0; i < hit_obj.length; i++) {
		if (/[,.]/.test(hit_obj[i].contents)) {continue;}
		if (hit_obj[i].contents.length == 3) {
			hit_obj[i].glyphForm = AlternateGlyphForms.THIRD_WIDTH_FORM;
		}
	}
} else if (ans_int == 6) {//４桁だけを四分字形にする
	for (var i = 0; i < hit_obj.length; i++) {
		if (/[,.]/.test(hit_obj[i].contents)) {continue;}
		if (hit_obj[i].contents.length == 4) {
			hit_obj[i].glyphForm = AlternateGlyphForms.QUARTER_WIDTH_FORM;
		}
	}
} else if (ans_int == 7) {//２桁を二分字形に、３桁を三分字形にする
	for (var i = 0; i < hit_obj.length; i++) {
		if (/[,.]/.test(hit_obj[i].contents)) {continue;}
		if (hit_obj[i].contents.length == 2) {
			hit_obj[i].glyphForm = AlternateGlyphForms.MONOSPACED_HALF_WIDTH_FORM;
		} else if (hit_obj[i].contents.length == 3) {
			hit_obj[i].glyphForm = AlternateGlyphForms.THIRD_WIDTH_FORM;
		}
	}
} else if (ans_int == 8) {//２桁を二分字形に、３桁を三分字形、４桁を四分字形にする
	for (var i = 0; i < hit_obj.length; i++) {
		if (/[,.]/.test(hit_obj[i].contents)) {continue;}
		if (hit_obj[i].contents.length == 2) {
			hit_obj[i].glyphForm = AlternateGlyphForms.MONOSPACED_HALF_WIDTH_FORM;
		} else if (hit_obj[i].contents.length == 3) {
			hit_obj[i].glyphForm = AlternateGlyphForms.THIRD_WIDTH_FORM;
		} else if (hit_obj[i].contents.length == 4) {
			hit_obj[i].glyphForm = AlternateGlyphForms.QUARTER_WIDTH_FORM;
		}
	}
	
}
