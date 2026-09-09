require 'xcodeproj'
require 'pathname'
root=File.expand_path('../mobile/ios',__dir__)
project=Xcodeproj::Project.open(File.join(root,'ContextFlow.xcodeproj'))
app=project.targets.find{|t|t.name=='ContextFlow'}
group=project.main_group.find_subpath('Voice',true)
add_source=lambda do |path,targets|
 ref=project.files.find{|f|f.path==path}||group.new_file(path)
 targets.each{|target|target.source_build_phase.add_file_reference(ref,true) unless target.source_build_phase.files_references.include?(ref)}
end
widget=project.targets.find{|t|t.name=='ContextFlowWidgets'}||project.new_target(:app_extension,'ContextFlowWidgets',:ios,'16.2')
app.add_dependency(widget) unless app.dependencies.any?{|d|d.target==widget}
embed=app.copy_files_build_phases.find{|p|p.name=='Embed ContextFlow Extensions'}||app.new_copy_files_build_phase('Embed ContextFlow Extensions')
embed.dst_subfolder_spec='13'
unless embed.files_references.include?(widget.product_reference)
 f=embed.add_file_reference(widget.product_reference,true);f.settings={'ATTRIBUTES'=>['RemoveHeadersOnCopy']}
end
['ContextFlow/ContextFlowGlass.swift','ContextFlow/VoiceTurnGate.swift','ContextFlow/VoiceCoordinator.swift','ContextFlow/ContextFlowVoice.swift','ContextFlow/ContextFlowVoice.m'].each{|p|add_source.call(p,[app])}
['Shared/ContextActivityAttributes.swift','Shared/ContextFlowIntents.swift'].each{|p|add_source.call(p,[app,widget])}
add_source.call('ContextFlowWidgets/ContextFlowWidgets.swift',[widget])
app.build_configurations.each do |c|
 c.build_settings['CODE_SIGN_ENTITLEMENTS']='ContextFlow/ContextFlow.entitlements'
 c.build_settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS']='$(inherited) CONTEXTFLOW_APP'
 c.build_settings['SWIFT_VERSION']='5.0'
 c.build_settings['CURRENT_PROJECT_VERSION']='2'
end
widget.build_configurations.each do |c|
 c.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'com.contextflow.prototype.widgets','PRODUCT_NAME'=>'ContextFlowWidgets','SWIFT_VERSION'=>'5.0','INFOPLIST_FILE'=>'ContextFlowWidgets/Info.plist','CODE_SIGN_ENTITLEMENTS'=>'ContextFlowWidgets/ContextFlowWidgets.entitlements','DEVELOPMENT_TEAM'=>'X8946QAT4X','CODE_SIGN_STYLE'=>'Automatic','MARKETING_VERSION'=>'1.0','CURRENT_PROJECT_VERSION'=>'2','TARGETED_DEVICE_FAMILY'=>'1,2','SKIP_INSTALL'=>'YES','GENERATE_INFOPLIST_FILE'=>'NO'})
end
share=project.targets.find{|t|t.name=='ContextFlowShare'}||project.new_target(:app_extension,'ContextFlowShare',:ios,'15.1')
app.add_dependency(share) unless app.dependencies.any?{|d|d.target==share}
unless embed.files_references.include?(share.product_reference)
 f=embed.add_file_reference(share.product_reference,true);f.settings={'ATTRIBUTES'=>['RemoveHeadersOnCopy']}
end
add_source.call('ContextFlowShare/ShareViewController.swift',[share])
share.build_configurations.each do |c|
 c.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'com.contextflow.prototype.share','PRODUCT_NAME'=>'ContextFlowShare','SWIFT_VERSION'=>'5.0','INFOPLIST_FILE'=>'ContextFlowShare/Info.plist','CODE_SIGN_ENTITLEMENTS'=>'ContextFlowShare/ContextFlowShare.entitlements','DEVELOPMENT_TEAM'=>'X8946QAT4X','CODE_SIGN_STYLE'=>'Automatic','MARKETING_VERSION'=>'1.0','CURRENT_PROJECT_VERSION'=>'2','TARGETED_DEVICE_FAMILY'=>'1,2','SKIP_INSTALL'=>'YES','GENERATE_INFOPLIST_FILE'=>'NO'})
end
project.save
puts 'Configured native voice and widget targets.'
