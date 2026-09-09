require 'xcodeproj'
root=File.expand_path('../mobile/ios',__dir__)
p=Xcodeproj::Project.open(File.join(root,'ContextFlow.xcodeproj'))
app=p.targets.find{|t|t.name=='ContextFlow'}
t=p.targets.find{|t|t.name=='ContextFlowUITests'}||p.new_target(:ui_test_bundle,'ContextFlowUITests',:ios,'16.2')
t.add_dependency(app) unless t.dependencies.any?{|d|d.target==app}
ref=p.files.find{|f|f.path=='ContextFlowUITests/ContextFlowUITests.swift'}||p.main_group.new_file('ContextFlowUITests/ContextFlowUITests.swift')
t.source_build_phase.add_file_reference(ref,true) unless t.source_build_phase.files_references.include?(ref)
t.build_configurations.each{|c|c.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'com.contextflow.prototype.uitests','PRODUCT_NAME'=>'ContextFlowUITests','SWIFT_VERSION'=>'5.0','GENERATE_INFOPLIST_FILE'=>'YES','DEVELOPMENT_TEAM'=>'X8946QAT4X','CODE_SIGN_STYLE'=>'Automatic','TEST_TARGET_NAME'=>'ContextFlow','TARGETED_DEVICE_FAMILY'=>'1,2'})}
p.save
scheme=Xcodeproj::XCScheme.new
scheme.add_build_target(app);scheme.add_test_target(t);scheme.set_launch_target(app)
scheme.test_action.xml_element.attributes['buildConfiguration']='Release'
scheme.launch_action.xml_element.attributes['buildConfiguration']='Release'
scheme.save_as(p.path,'ContextFlowQA',true)
puts 'Configured device UI tests.'
