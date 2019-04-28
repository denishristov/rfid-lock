#define BUZZER_PIN D8
#define SS_PIN D2
#define RST_PIN D1

#include <SPI.h>
#include <MFRC522.h>
#include <bits/stdc++.h> 
#include <TaskScheduler.h>
#include <ArduinoJson.h>

typedef DynamicJsonDocument JSON;
typedef void(*handler)(const JSON&, JSON&);

MFRC522 mfrc522(SS_PIN, RST_PIN);

class Identity {
  const char* _name;
  const char* _image;
  const char* _uuid;
  const char* _timestamp;

public:

  Identity(
    const char* name,
    const char* image,
    const char* uuid,
    const char* timestamp
  ): 
    _name(name),
    _image(image),
    _uuid(uuid),
    _timestamp(timestamp)
  {}

  const char* get_name() {
    return _name;
  }

  const char* get_image() {   
    return _image;
  }

  const char* get_uuid() {
    return _uuid;
  }

  const char* get_timestamp() {
    return _timestamp;
  }
};

std::unordered_map<std::string, Identity*> ids;
std::unordered_map<std::string, handler> operations;
std::deque<std::string> history;

bool is_register_mode = false;

void toggle_register_mode(const JSON& input, JSON& output)
{
  is_register_mode = !is_register_mode;
}

void register_id(const JSON& input, JSON& output)
{
  const char* name = strdup(input["name"]);
  const char* image = strdup(input["image"]);
  const char* uuid = strdup(input["uuid"]);
  const char* timestamp = strdup(input["timestamp"]);

  ids[uuid] = new Identity(name, image, uuid, timestamp);
}

void read_RFID() {
  if (!mfrc522.PICC_IsNewCardPresent()) 
  {
    return;
  }
  
  if (!mfrc522.PICC_ReadCardSerial()) 
  {
    return;
  }

  std::string uuid_buffer;
  uuid_buffer.reserve(16);
  
  for (byte i = 0; i < mfrc522.uid.size; i++) 
  {
    uuid_buffer.append(mfrc522.uid.uidByte[i] < 0x10 ? "-0" : "-");
    uuid_buffer.append(String(mfrc522.uid.uidByte[i], HEX).c_str());
  }

  const char* uuid = uuid_buffer.substr(1).c_str();

  if (is_register_mode) 
  {
    is_register_mode = false;
    JSON output(256);

    output["uuid"] = uuid;
    output["type"] = "scan";

    serializeJson(output, Serial);
    Serial.println();
  }
  else
  {
    bool is_matching = ids.find(uuid_buffer.substr(1)) != ids.end();

    JSON output(256);

    output["uuid"] = uuid;
    output["type"] = "scan";
    output["isMatching"] = is_matching;

    char output_buffer[256];
    serializeJson(output, output_buffer);

    if (history.size() > 255)
    {
      history.pop_back();
    }

    history.push_front(output_buffer);
    Serial.println(output_buffer);

    if (is_matching)
    {
      tone(BUZZER_PIN, 4000);
      delay(300);
      noTone(BUZZER_PIN);
    } 
    else 
    {
      tone(BUZZER_PIN, 500);
      delay(100);
      noTone(BUZZER_PIN);
      delay(50);
      tone(BUZZER_PIN, 500);
      delay(100);
      noTone(BUZZER_PIN);
    }
  }
}

void serial_communication() {
  if (Serial.available())
  {
    String payload = Serial.readString().c_str();
    
    JSON input(256); 

    if (deserializeJson(input, payload) != DeserializationError::Ok) 
    {
      Serial.println("JSON parsing failed");
      return;
    }

    JSON output(256);

    const char* type = input["type"];
    
    output["type"] = type;
    operations[type](input, output);
    
    serializeJson(output, Serial);
    Serial.println();
  }
}

void get_all(const JSON& input, JSON& output)
{
  const JsonArray& data_ids = output.createNestedArray("ids");
      
  for (const auto& id: ids) 
  {
    const JsonObject& indentity = data_ids.createNestedObject();
    
    indentity["uuid"] = id.second->get_uuid();
    indentity["name"] = id.second->get_name();
    indentity["image"] = id.second->get_image();
    indentity["timestamp"] = id.second->get_timestamp();
  }

  const JsonArray& data_history = output.createNestedArray("history");
      
  for (const auto& scan: history) 
  {
    data_history.add(scan.c_str());
  }
}
 
Scheduler runner;

Task RFID_task(100, TASK_FOREVER, &read_RFID);
Task communication_task(100, TASK_FOREVER, &serial_communication);
 
void setup() 
{
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(BUZZER_PIN, OUTPUT);

  // ids.insert("e4-10-6a-1f");

  operations["get"] = get_all;
  operations["toggleRegister"] = toggle_register_mode;
  operations["register"] = register_id;
  
  runner.init();

  runner.addTask(RFID_task);
  runner.addTask(communication_task);

  RFID_task.enable();
  communication_task.enable();
}

void loop() 
{
  runner.execute();
} 
