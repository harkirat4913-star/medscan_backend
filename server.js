import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class UploadScreen extends StatefulWidget {
  UploadScreen({super.key});

  @override
  State<UploadScreen> createState() =>
      _UploadScreenState();
}

class _UploadScreenState
    extends State<UploadScreen> {

  final ImagePicker picker =
      ImagePicker();

  XFile? selectedImage;

  Uint8List? imageBytes;

  bool isLoading = false;

  String aiAnalysis = "";

  String errorMessage = "";

  String selectedLanguage = "English";


  // Render backend
  final String backendUrl =
      "https://medscan-backend-xaim.onrender.com/analyze-image";


  // ==================================================
  // PICK IMAGE
  // ==================================================

  Future<void> pickImage(
    ImageSource source,
  ) async {

    try {

      final XFile? image =
          await picker.pickImage(
        source: source,
        imageQuality: 90,
      );

      if (image == null) {
        return;
      }

      final Uint8List bytes =
          await image.readAsBytes();

      setState(() {

        selectedImage = image;

        imageBytes = bytes;

        aiAnalysis = "";

        errorMessage = "";

      });

    } catch (e) {

      setState(() {

        errorMessage =
            "Could not select image: $e";

      });

    }
  }


  // ==================================================
  // ANALYZE PRESCRIPTION
  // ==================================================

  Future<void>
      analyzePrescription() async {

    if (selectedImage == null ||
        imageBytes == null) {

      setState(() {

        errorMessage =
            "Please select a prescription image first.";

      });

      return;
    }


    setState(() {

      isLoading = true;

      aiAnalysis = "";

      errorMessage = "";

    });


    try {

      final request =
          http.MultipartRequest(
        "POST",
        Uri.parse(backendUrl),
      );


      // ----------------------------------------------
      // SEND SELECTED LANGUAGE
      // ----------------------------------------------

      request.fields["language"] =
          selectedLanguage;


      // ----------------------------------------------
      // SEND IMAGE
      // ----------------------------------------------

      request.files.add(
        http.MultipartFile.fromBytes(
          "image",
          imageBytes!,
          filename:
              selectedImage!.name,
        ),
      );


      print(
        "=============================="
      );

      print(
        "Sending image to MedScan AI"
      );

      print(
        "Language: $selectedLanguage"
      );


      final streamedResponse =
          await request.send();


      final response =
          await http.Response.fromStream(
        streamedResponse,
      );


      print(
        "STATUS: ${response.statusCode}"
      );

      print(
        "RESPONSE: ${response.body}"
      );


      // ----------------------------------------------
      // CHECK SERVER RESPONSE
      // ----------------------------------------------

      if (response.statusCode != 200) {

        throw Exception(
          "Server error ${response.statusCode}: ${response.body}",
        );

      }


      // ----------------------------------------------
      // DECODE RESPONSE
      // ----------------------------------------------

      final Map<String, dynamic> data =
          jsonDecode(response.body);


      final String answer =
          data["answer"]?.toString() ??
              "No AI response.";


      setState(() {

        aiAnalysis = answer;

        isLoading = false;

      });


    } catch (e) {

      print(
        "ANALYSIS ERROR: $e"
      );


      setState(() {

        isLoading = false;

        errorMessage =
            "Analysis failed: $e";

      });

    }
  }


  // ==================================================
  // REMOVE IMAGE
  // ==================================================

  void clearImage() {

    setState(() {

      selectedImage = null;

      imageBytes = null;

      aiAnalysis = "";

      errorMessage = "";

    });

  }


  // ==================================================
  // BUILD
  // ==================================================

  @override
  Widget build(
    BuildContext context,
  ) {

    return Scaffold(

      appBar: AppBar(

        title:
            Text(
          "Upload Prescription",
        ),

      ),


      body:
          SingleChildScrollView(

        padding:
            EdgeInsets.all(20),

        child:
            Column(

          children: [

            // ========================================
            // LANGUAGE
            // ========================================

            Align(

              alignment:
                  Alignment.centerLeft,

              child:
                  Text(

                "Answer Language",

                style:
                    TextStyle(

                  fontSize: 16,

                  fontWeight:
                      FontWeight.bold,

                ),

              ),

            ),


            SizedBox(
              height: 8,
            ),


            Container(

              width:
                  double.infinity,

              padding:
                  EdgeInsets.symmetric(
                horizontal: 15,
              ),

              decoration:
                  BoxDecoration(

                border:
                    Border.all(
                  color:
                      Colors.blue,
                ),

                borderRadius:
                    BorderRadius.circular(
                  12,
                ),

              ),

              child:
                  DropdownButtonHideUnderline(

                child:
                    DropdownButton<String>(

                  value:
                      selectedLanguage,

                  isExpanded:
                      true,

                  items: [

                    DropdownMenuItem(

                      value:
                          "English",

                      child:
                          Text(
                        "English",
                      ),

                    ),

                    DropdownMenuItem(

                      value:
                          "Hindi",

                      child:
                          Text(
                        "हिन्दी",
                      ),

                    ),

                    DropdownMenuItem(

                      value:
                          "Punjabi",

                      child:
                          Text(
                        "ਪੰਜਾਬੀ",
                      ),

                    ),

                  ],


                  onChanged:
                      isLoading
                          ? null
                          : (value) {

                              if (value ==
                                  null) {
                                return;
                              }

                              setState(() {

                                selectedLanguage =
                                    value;

                                aiAnalysis =
                                    "";

                                errorMessage =
                                    "";

                              });

                            },

                ),

              ),

            ),


            SizedBox(
              height: 20,
            ),


            // ========================================
            // IMAGE PREVIEW
            // ========================================

            Container(

              width:
                  double.infinity,

              height: 250,

              decoration:
                  BoxDecoration(

                border:
                    Border.all(
                  color:
                      Colors.blue,
                  width: 1.5,
                ),

                borderRadius:
                    BorderRadius.circular(
                  15,
                ),

              ),


              child:

                  imageBytes == null

                      ? Center(

                          child:
                              Column(

                            mainAxisAlignment:
                                MainAxisAlignment
                                    .center,

                            children: [

                              Icon(

                                Icons.image,

                                size:
                                    70,

                                color:
                                    Colors.grey,

                              ),

                              SizedBox(
                                height:
                                    10,
                              ),

                              Text(

                                "Select prescription image",

                                style:
                                    TextStyle(

                                  color:
                                      Colors.grey,

                                  fontSize:
                                      16,

                                ),

                              ),

                            ],

                          ),

                        )

                      : ClipRRect(

                          borderRadius:
                              BorderRadius.circular(
                            15,
                          ),

                          child:
                              Image.memory(

                            imageBytes!,

                            fit:
                                BoxFit.contain,

                          ),

                        ),

            ),


            SizedBox(
              height: 20,
            ),


            // ========================================
            // CAMERA + GALLERY
            // ========================================

            Row(

              children: [

                Expanded(

                  child:
                      ElevatedButton.icon(

                    onPressed:
                        isLoading
                            ? null
                            : () {

                                pickImage(
                                  ImageSource
                                      .camera,
                                );

                              },

                    icon:
                        Icon(
                      Icons.camera_alt,
                    ),

                    label:
                        Text(
                      "Camera",
                    ),

                  ),

                ),


                SizedBox(
                  width: 10,
                ),


                Expanded(

                  child:
                      ElevatedButton.icon(

                    onPressed:
                        isLoading
                            ? null
                            : () {

                                pickImage(
                                  ImageSource
                                      .gallery,
                                );

                              },

                    icon:
                        Icon(
                      Icons.photo,
                    ),

                    label:
                        Text(
                      "Gallery",
                    ),

                  ),

                ),

              ],

            ),


            SizedBox(
              height: 15,
            ),


            // ========================================
            // REMOVE IMAGE
            // ========================================

            if (selectedImage != null)

              SizedBox(

                width:
                    double.infinity,

                child:
                    OutlinedButton.icon(

                  onPressed:
                      isLoading
                          ? null
                          : clearImage,

                  icon:
                      Icon(
                    Icons.delete_outline,
                  ),

                  label:
                      Text(
                    "Remove Image",
                  ),

                ),

              ),


            SizedBox(
              height: 15,
            ),


            // ========================================
            // ANALYZE BUTTON
            // ========================================

            SizedBox(

              width:
                  double.infinity,

              height: 52,

              child:
                  ElevatedButton.icon(

                onPressed:
                    selectedImage ==
                                null ||
                            isLoading
                        ? null
                        : analyzePrescription,


                icon:

                    isLoading

                        ? SizedBox(

                            width:
                                20,

                            height:
                                20,

                            child:
                                CircularProgressIndicator(

                              strokeWidth:
                                  2,

                              color:
                                  Colors.white,

                            ),

                          )

                        : Icon(
                            Icons
                                .smart_toy,
                          ),


                label:

                    Text(

                  isLoading

                      ? "Analyzing..."

                      : "Analyze Prescription",

                ),

              ),

            ),


            SizedBox(
              height: 25,
            ),


            // ========================================
            // LOADING
            // ========================================

            if (isLoading)

              Column(

                children: [

                  CircularProgressIndicator(),

                  SizedBox(
                    height: 12,
                  ),

                  Text(

                    "AI is analyzing your image...",

                    textAlign:
                        TextAlign.center,

                  ),

                ],

              ),


            // ========================================
            // ERROR
            // ========================================

            if (errorMessage.isNotEmpty)

              Card(

                color:
                    Colors.red.shade50,

                child:
                    Padding(

                  padding:
                      EdgeInsets.all(
                    16,
                  ),

                  child:
                      Row(

                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                    children: [

                      Icon(

                        Icons
                            .error_outline,

                        color:
                            Colors.red,

                      ),

                      SizedBox(
                        width: 10,
                      ),

                      Expanded(

                        child:
                            Text(

                          errorMessage,

                          style:
                              TextStyle(

                            color:
                                Colors.red,

                          ),

                        ),

                      ),

                    ],

                  ),

                ),

              ),


            // ========================================
            // AI ANSWER
            // ========================================

            if (aiAnalysis.isNotEmpty)

              Card(

                elevation:
                    5,

                margin:
                    EdgeInsets.only(
                  top: 15,
                ),

                shape:
                    RoundedRectangleBorder(

                  borderRadius:
                      BorderRadius.circular(
                    18,
                  ),

                ),


                child:
                    Padding(

                  padding:
                      EdgeInsets.all(
                    20,
                  ),

                  child:
                      Column(

                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                    children: [

                      Row(

                        children: [

                          Icon(

                            Icons
                                .smart_toy,

                            color:
                                Colors.purple,

                            size:
                                30,

                          ),

                          SizedBox(
                            width: 10,
                          ),

                          Text(

                            "MedScan AI",

                            style:
                                TextStyle(

                              fontSize:
                                  21,

                              fontWeight:
                                  FontWeight.bold,

                            ),

                          ),

                        ],

                      ),


                      SizedBox(
                        height: 18,
                      ),


                      SelectableText(

                        aiAnalysis,

                        style:
                            TextStyle(

                          fontSize:
                              16,

                          height:
                              1.5,

                        ),

                      ),

                    ],

                  ),

                ),

              ),


            // ========================================
            // SAFETY NOTICE
            // ========================================

            if (aiAnalysis.isNotEmpty)

              Container(

                margin:
                    EdgeInsets.only(
                  top: 15,
                ),

                padding:
                    EdgeInsets.all(
                  14,
                ),

                decoration:
                    BoxDecoration(

                  color:
                      Colors.orange
                          .shade50,

                  borderRadius:
                      BorderRadius.circular(
                    12,
                  ),

                ),


                child:
                    Row(

                  crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                  children: [

                    Icon(

                      Icons
                          .warning_amber,

                      color:
                          Colors.orange,

                    ),

                    SizedBox(
                      width: 10,
                    ),


                    Expanded(

                      child:
                          Text(

                        "MedScan AI provides informational assistance only. Confirm medicines and dosage with a qualified healthcare professional.",

                      ),

                    ),

                  ],

                ),

              ),


            SizedBox(
              height: 30,
            ),

          ],

        ),

      ),

    );

  }
}
