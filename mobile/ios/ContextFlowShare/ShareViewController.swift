import UIKit
import UniformTypeIdentifiers
import Security

final class ShareViewController:UIViewController {
  private let summary=UITextView(),instruction=UITextView(),status=UILabel(),send=UIButton(type:.system)
  private var sourceURL:String?
  override func viewDidLoad(){
    super.viewDidLoad();view.backgroundColor = .systemBackground
    let title=UILabel();title.text="Continue in ContextFlow";title.font = .boldSystemFont(ofSize:22)
    let detail=UILabel();detail.text="Research is context. Your instruction decides the action.";detail.font = .systemFont(ofSize:14);detail.textColor = .secondaryLabel;detail.numberOfLines=0
    summary.isEditable=false;summary.font = .systemFont(ofSize:14);summary.backgroundColor = .secondarySystemBackground;summary.layer.cornerRadius=14;summary.accessibilityLabel="Shared research"
    let label=UILabel();label.text="Your instruction (optional)";label.font = .preferredFont(forTextStyle:.subheadline)
    instruction.font = .systemFont(ofSize:16);instruction.backgroundColor = .secondarySystemBackground;instruction.layer.cornerRadius=14;instruction.accessibilityLabel="Your instruction"
    send.setTitle("Send context",for:.normal);send.titleLabel?.font = .boldSystemFont(ofSize:16);send.backgroundColor = .systemBlue;send.tintColor = .white;send.layer.cornerRadius=14;send.addTarget(self,action:#selector(submit),for:.touchUpInside)
    status.numberOfLines=0;status.font = .systemFont(ofSize:13);status.textColor = .secondaryLabel
    let cancel=UIButton(type:.system);cancel.setTitle("Close",for:.normal);cancel.addTarget(self,action:#selector(close),for:.touchUpInside)
    let stack=UIStackView(arrangedSubviews:[title,detail,summary,label,instruction,send,status,cancel]);stack.axis = .vertical;stack.spacing=16;stack.translatesAutoresizingMaskIntoConstraints=false;view.addSubview(stack)
    NSLayoutConstraint.activate([stack.topAnchor.constraint(equalTo:view.safeAreaLayoutGuide.topAnchor,constant:24),stack.leadingAnchor.constraint(equalTo:view.leadingAnchor,constant:22),stack.trailingAnchor.constraint(equalTo:view.trailingAnchor,constant:-22),summary.heightAnchor.constraint(equalToConstant:140),instruction.heightAnchor.constraint(equalToConstant:100),send.heightAnchor.constraint(equalToConstant:50)])
    loadSharedContent()
  }
  private func loadSharedContent(){
    let providers=(extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap{$0.attachments ?? []}
    for provider in providers {
      let type=provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) ? UTType.url.identifier:UTType.plainText.identifier
      if provider.hasItemConformingToTypeIdentifier(type){provider.loadItem(forTypeIdentifier:type,options:nil){[weak self] item,_ in
        let value=(item as? URL)?.absoluteString ?? item as? String ?? ""
        DispatchQueue.main.async {self?.summary.text += (self?.summary.text.isEmpty == false ? "\n":"")+value;if let url=item as? URL{self?.sourceURL=url.absoluteString}}
      }}
    }
  }
  @objc private func submit(){
    guard !summary.text.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty else{status.text="No text or link was shared.";return}
    let defaults=UserDefaults(suiteName:"group.com.contextflow.prototype")
    let group=Bundle.main.object(forInfoDictionaryKey:"ContextFlowKeychainGroup") as? String ?? ""
    let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"com.contextflow.prototype.session",kSecAttrAccessGroup as String:group,kSecReturnData as String:true]
    var found:CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary,&found)==errSecSuccess,let data=found as? Data,let token=String(data:data,encoding:.utf8),let base=defaults?.string(forKey:"baseURL"),let url=URL(string:base+"/api/handoffs") else{status.text="Open ContextFlow and sign in to the demo once, then share again.";return}
    let now=ISO8601DateFormatter().string(from:Date());let sources:[[String:Any]]=sourceURL.map{[["title":"Shared research","url":$0,"retrievedAt":now]]} ?? []
    let h:[String:Any]=["version":1,"handoffId":UUID().uuidString,"instruction":instruction.text ?? "","research":["summary":String(summary.text.prefix(16000)),"sources":sources],"createdAt":now]
    var request=URLRequest(url:url);request.httpMethod="POST";request.timeoutInterval=15;request.setValue("Bearer "+token,forHTTPHeaderField:"Authorization");request.setValue("application/json",forHTTPHeaderField:"Content-Type");request.httpBody=try? JSONSerialization.data(withJSONObject:h)
    send.isEnabled=false;status.text="Sending context…"
    URLSession.shared.dataTask(with:request){[weak self] data,response,error in DispatchQueue.main.async {
      self?.send.isEnabled=true
      guard error==nil,let http=response as? HTTPURLResponse,(200..<300).contains(http.statusCode) else{self?.status.text="Could not send context. Check the ContextFlow backend connection.";return}
      self?.status.text="Context received. Say ‘Start voice control in ContextFlow’ to continue. No bet has been placed."
      self?.send.isEnabled=false
    }}.resume()
  }
  @objc private func close(){extensionContext?.completeRequest(returningItems:nil,completionHandler:nil)}
}
