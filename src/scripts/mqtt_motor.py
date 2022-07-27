#!/usr/bin/python3

import time
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt

global client

# set Pins
motorPin = 17
heaterPin = 4
# Setup pins for pump and heater
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.setup(motorPin, GPIO.OUT)
GPIO.setup(heaterPin, GPIO.OUT)


# Methods
def enablePump(): 
	# print("turning on pump")
	GPIO.output(motorPin, GPIO.LOW)
	client.publish("relay/pump", "STATUS_ON")

def disablePump(): 
	# print("turning off pump")
	GPIO.output(motorPin, GPIO.HIGH)
	client.publish("relay/pump", "STATUS_OFF")

def enableHeater(): 
	print("turning on heater")
	GPIO.output(heaterPin, GPIO.LOW)
	client.publish("relay/heater", "STATUS_ON")

def disableHeater(): 
	# print("turning on heater")
	GPIO.output(heaterPin, GPIO.HIGH)
	client.publish("relay/heater", "STATUS_OFF")

def getPumpStatus():
	status = GPIO.input(motorPin)
	# print("getting GPIO 17 status")
	if (status):
		client.publish("relay/pump", "STATUS_OFF")
	else:
		client.publish("relay/pump", "STATUS_ON")

def getHeaterStatus():
	status = GPIO.input(heaterPin)
	# print("getting GPIO status")
	if (status):
		client.publish("relay/heater", "STATUS_OFF")
	else:
		client.publish("relay/heater", "STATUS_ON")

def on_connect(client, userdata, flags, rc):
	# print("client connected")
	disablePump()
	disableHeater()
	pass

def on_subscribe(client, userdata, mid, granted_qos):
	# print("subscribed")
	pass

def on_message(client, userdata, message):
	# print(message.topic + " " + str(message.payload))
	# React to message received
	group,sensor = message.topic.split("/")
	msg = message.payload.decode("utf-8")
	# print(msg)

	if (group == "relay"):
		if (sensor == "pump"):
			if (msg == "STATUS"):
				getPumpStatus()
			elif (msg == "ON"):
				enablePump()
			elif (msg == "OFF"):
				disablePump()
		elif (sensor == "heater"):
			if (msg == "STATUS"):
				getHeaterStatus()
			elif (msg == "ON"):
				enableHeater()
			elif (msg == "OFF"):
				disableHeater()
# Main loop
# connect to broker and subscribe
broker_address = "192.168.1.16"
client = mqtt.Client("motors")
client.on_message = on_message
client.on_connect = on_connect
client.on_subscribe = on_subscribe
client.connect(broker_address, 1883)
# print("subscribing")
client.subscribe([("relay/pump",2),("relay/heater",1)])
# print("subscribed")
client.loop_forever()
